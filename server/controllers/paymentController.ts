import Razorpay from "razorpay";
import crypto from "crypto";
import { Request, Response } from "express";
import Movie from "../models/Movie.js";
import Purchase from "../models/Purchase.js";
import License from "../models/License.js";
import User from "../models/User.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
console.log("paymentController loaded");
// POST /api/payment/create-order
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { movieId } = req.body;
        if (!movieId) return res.status(400).json({ success: false, message: "movieId is required" });

        const movie = await Movie.findById(movieId);
        if (!movie || !movie.isActive)
            return res.status(404).json({ success: false, message: "Movie not found or inactive" });

        const existingLicense = await License.findOne({ user: req.user._id, movie: movieId });
        if (existingLicense && existingLicense.isValid()) {
            return res.status(400).json({
                success: false,
                message: "You already have an active license for this movie",
                expiresAt: existingLicense.expiryDate,
            });
        }

        const amountInPaise = Math.round(movie.price * 100);

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            notes: {
                movieId: movieId.toString(),
                userId: req.user._id.toString(),
            },
        });

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + movie.expiryDays);

        const purchase = await Purchase.create({
            user: req.user._id,
            movie: movieId,
            razorpayOrderId: order.id,
            amountPaid: movie.price,
            expiryDate,
            status: "pending",
        });

        res.json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                purchaseId: purchase._id,
                movieTitle: movie.title,
                key: process.env.RAZORPAY_KEY_ID,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/payment/verify
export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        console.log("verifyPayment called:", {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            hasSignature: !!razorpay_signature,
        });

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.log("Missing fields:", { razorpay_order_id, razorpay_payment_id, razorpay_signature });
            return res.status(400).json({
                success: false,
                message: `Missing payment fields: ${[
                    !razorpay_order_id && "order_id",
                    !razorpay_payment_id && "payment_id",
                    !razorpay_signature && "signature",
                ].filter(Boolean).join(", ")}`,
            });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest("hex");

        console.log("Signature check:", {
            expected: expectedSignature,
            received: razorpay_signature,
            match: expectedSignature === razorpay_signature,
        });

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature",
            });
        }

        const purchase = await Purchase.findOne({ razorpayOrderId: razorpay_order_id });
        console.log("Purchase found:", purchase ? purchase._id : "NOT FOUND");

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: `Purchase not found for order: ${razorpay_order_id}`,
            });
        }

        purchase.razorpayPaymentId = razorpay_payment_id;
        purchase.status = "active";
        await purchase.save();

        await License.findOneAndDelete({ user: purchase.user, movie: purchase.movie });

        const license = await License.create({
            user: purchase.user,
            movie: purchase.movie,
            purchase: purchase._id,
            expiryDate: purchase.expiryDate,
        });

        await User.findByIdAndUpdate(purchase.user, {
            $addToSet: { purchasedMovies: purchase.movie },
        });

        console.log("License created:", license._id);

        res.json({
            success: true,
            message: "Payment verified. License activated.",
            data: {
                licenseId: license._id,
                expiryDate: license.expiryDate,
                movieId: purchase.movie,
            },
        });
    } catch (error: any) {
        console.error("verifyPayment error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST + GET /api/payment/callback — called by Razorpay JS handler
export const handlePaymentCallback = async (req: Request, res: Response) => {
    try {
        const appScheme = "a2scinemas";

        // GET = cancel from browser URL
        if (req.method === "GET") {
            return res.redirect(`${appScheme}://payment?status=cancelled`);
        }

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        if (!razorpay_payment_id || !razorpay_order_id) {
            return res.json({ deepLinkUrl: `${appScheme}://payment?status=cancelled` });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSig = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest("hex");

        if (expectedSig !== razorpay_signature) {
            return res.json({
                deepLinkUrl: `${appScheme}://payment?status=failed&reason=signature_mismatch`,
            });
        }

        const purchase = await Purchase.findOne({ razorpayOrderId: razorpay_order_id });
        if (!purchase) {
            return res.json({
                deepLinkUrl: `${appScheme}://payment?status=failed&reason=purchase_not_found`,
            });
        }

        purchase.razorpayPaymentId = razorpay_payment_id;
        purchase.status = "active";
        await purchase.save();

        await License.findOneAndDelete({ user: purchase.user, movie: purchase.movie });
        await License.create({
            user: purchase.user,
            movie: purchase.movie,
            purchase: purchase._id,
            expiryDate: purchase.expiryDate,
        });

        await User.findByIdAndUpdate(purchase.user, {
            $addToSet: { purchasedMovies: purchase.movie },
        });

        const deepLinkUrl = `${appScheme}://payment?status=success&movie_id=${purchase.movie}`;
        return res.json({ deepLinkUrl, success: true });

    } catch (error: any) {
        console.error("Payment callback error:", error);
        return res.json({
            deepLinkUrl: `a2scinemas://payment?status=failed&reason=server_error`,
        });
    }
};

// GET /api/payment/pay/:orderId — serves HTML payment page (no auth required)
export const servePaymentPage = async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { amount, currency, key, movieTitle, movieId } = req.query;

    const baseUrl = process.env.BASE_URL || "https://ott-platform-a2s-cinemas.onrender.com/api";
    const callbackUrl = `${baseUrl}/payment/callback`;
    const displayAmount = Math.round(Number(amount) / 100);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>A2S Cinemas — Payment</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,sans-serif;background:#0f0f14;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;padding:24px}
    .logo{font-size:26px;font-weight:700;color:#e50914}
    .movie{font-size:15px;color:#aaa}
    .amount{font-size:34px;font-weight:700}
    .spinner{width:36px;height:36px;border:3px solid #333;border-top-color:#e50914;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .status{font-size:15px;color:#888;text-align:center}
    .success{color:#1d9e75;font-weight:600}
    .failed{color:#e24b4a}
    .close-hint{font-size:13px;color:#555;text-align:center;border:1px solid #333;padding:10px 16px;border-radius:8px;display:none}
    .btn{background:#e50914;color:#fff;border:none;border-radius:50px;padding:13px 28px;font-size:15px;font-weight:700;cursor:pointer;display:none}
  </style>
</head>
<body>
  <div class="logo">🎬 A2S Cinemas</div>
  <div class="movie">${movieTitle || "Movie"}</div>
  <div class="amount">₹${displayAmount}</div>
  <div class="spinner" id="spinner"></div>
  <div class="status" id="status">Opening payment...</div>
  <div class="close-hint" id="close-hint">← Tap the back arrow or close this tab to return to the app</div>
  <button class="btn" id="retry-btn" onclick="openRazorpay()">Try Again</button>

  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function showStatus(msg, type) {
      var el = document.getElementById('status');
      el.textContent = msg;
      el.className = 'status ' + (type || '');
    }

    function openRazorpay() {
      document.getElementById('spinner').style.display = 'block';
      document.getElementById('retry-btn').style.display = 'none';
      document.getElementById('close-hint').style.display = 'none';
      showStatus('Opening payment...');

      var rzp = new Razorpay({
        key: '${key}',
        amount: '${amount}',
        currency: '${currency || "INR"}',
        order_id: '${orderId}',
        name: 'A2S Cinemas',
        description: 'Access: ${movieTitle}',
        prefill: { contact: '9999999999', email: 'test@a2s.com' },
        theme: { color: '#e50914' },
        handler: function(response) {
          showStatus('Verifying payment...');

          fetch('${callbackUrl}', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            })
          })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            document.getElementById('spinner').style.display = 'none';
            showStatus('Payment successful! Returning to app...', 'success');

            // Step 1: try window.close() — works in Android Chrome WebView
            setTimeout(function() {
              window.close();

              // Step 2: try deep link after 600ms (if close didn't work)
              setTimeout(function() {
                window.location.href = data.deepLinkUrl || 'a2scinemas://payment?status=success&movie_id=${movieId}';

                // Step 3: show manual hint after 2s (last resort)
                setTimeout(function() {
                  document.getElementById('close-hint').style.display = 'block';
                }, 2000);
              }, 600);
            }, 800);
          })
          .catch(function() {
            document.getElementById('spinner').style.display = 'none';
            showStatus('Verification failed. Contact support.', 'failed');
          });
        },
        modal: {
          ondismiss: function() {
            document.getElementById('spinner').style.display = 'none';
            showStatus('Payment cancelled');
            document.getElementById('retry-btn').style.display = 'block';
          }
        }
      });

      rzp.on('payment.failed', function(response) {
        document.getElementById('spinner').style.display = 'none';
        showStatus('Payment failed: ' + (response.error.description || 'please try again'), 'failed');
        document.getElementById('retry-btn').style.display = 'block';
      });

      rzp.open();
    }

    window.onload = function() { setTimeout(openRazorpay, 300); };
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
};