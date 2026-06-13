import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator, Alert, Dimensions, Image,
    KeyboardAvoidingView, Modal, Platform, ScrollView,
    Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import api from "@/constants/api";
import { COLORS } from "@/constants";
import { Movie, Review, MyReview } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { useLicense } from "@/context/LicenseContext";
import Toast from "react-native-toast-message";
import RazorpayCheckout from "react-native-razorpay";

const { width } = Dimensions.get("window");

// Star rating component
function StarRating({
    rating,
    onRate,
    size = 20,
    readonly = false,
}: {
    rating: number;
    onRate?: (r: number) => void;
    size?: number;
    readonly?: boolean;
}) {
    return (
        <View style={{ flexDirection: "row", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => !readonly && onRate?.(star)}
                    disabled={readonly}
                    activeOpacity={readonly ? 1 : 0.7}
                >
                    <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={size}
                        color={star <= rating ? "#FFD700" : "#ccc"}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
}

export default function MovieDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user, isSignedIn } = useAuth();
    const { hasLicense, getDaysLeft, fetchLicenses } = useLicense();

    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [buyLoading, setBuyLoading] = useState(false);
    const [checkingPayment, setCheckingPayment] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState<Review[]>([]);
    const [myReview, setMyReview] = useState<MyReview | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsTotal, setReviewsTotal] = useState(0);

    const owned = id ? hasLicense(id) : false;
    const daysLeft = id ? getDaysLeft(id) : 0;

    useEffect(() => {
        if (id) {
            fetchMovie();
            fetchReviews();
            if (isSignedIn) fetchMyReview();
        }
    }, [id]);

    const fetchMovie = async () => {
        try {
            const { data } = await api.get(`/movies/${id}`);
            setMovie(data.data);
        } catch (error) {
            console.error("Failed to fetch movie:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async (page = 1) => {
        try {
            const { data } = await api.get(`/reviews/movie/${id}?page=${page}&limit=5`);
            if (page === 1) {
                setReviews(data.data);
            } else {
                setReviews((prev) => [...prev, ...data.data]);
            }
            setReviewsTotal(data.pagination.total);
            setReviewsPage(page);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        }
    };

    const fetchMyReview = async () => {
        try {
            const { data } = await api.get(`/reviews/my/${id}`);
            if (data.data) {
                setMyReview(data.data);
                setReviewRating(data.data.rating);
                setReviewComment(data.data.comment || "");
            }
        } catch (error) {
            console.error("Failed to fetch my review:", error);
        }
    };

   const handleSubmitReview = async () => {
        if (reviewRating === 0) {
            Toast.show({ type: "error", text1: "Rating required", text2: "Please select a star rating." });
            return;
        }

        setSubmittingReview(true);
        try {
            await api.post("/reviews", {
                movieId: id,
                rating: reviewRating,
                comment: reviewComment.trim() || undefined,
            });

            setShowReviewModal(false);
            await fetchMyReview();
            await fetchReviews(1);
            await fetchMovie();

            Toast.show({ type: "success", text1: "Review submitted successfully" });
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Failed",
                text2: error.response?.data?.message || "Could not submit review",
            });
        } finally {
            setSubmittingReview(false);
        }
    };
//Removed HTML Render Pages 
//     const handleBuy = async () => {
//         if (!isSignedIn) {
//             return Alert.alert(
//                 "Sign in required",
//                 "Please sign in to purchase movies",
//                 [
//                     { text: "Sign In", onPress: () => router.push("/sign-in") },
//                     { text: "Cancel", style: "cancel" },
//                 ]
//             );
//         }

//         setBuyLoading(true);
//         try {
//             const orderRes = await api.post("/payment/create-order", { movieId: id });
//             if (!orderRes.data.success) {
//                 Alert.alert("Error", orderRes.data.message || "Failed to create order");
//                 return;
//             }

//             const { orderId, amount, currency, key } = orderRes.data.data;
//            const baseUrl = process.env.EXPO_PUBLIC_API_URL;

// const payUrl =
//   `${baseUrl}/payment/pay/${orderId}` +
//   `?amount=${amount}` +
//   `&currency=${currency || "INR"}` +
//   `&key=${key}` +
//   `&movieTitle=${encodeURIComponent(movie?.title || "")}` +
//   `&movieId=${id}`;

//             await WebBrowser.openBrowserAsync(payUrl, { dismissButtonStyle: "close" });

//             setCheckingPayment(true);
//             let attempts = 0;

//             const poll = async () => {
//                 while (attempts < 6) {
//                     try {
//                         const res = await api.get(`/license/check/${id}`);
//                         if (res.data.hasAccess === true) {
//                             await fetchLicenses();
//                             await fetchMovie();
//                             router.replace({
//                                 pathname: "/payment/callback",
//                                 params: { status: "success", movie_id: id as string },
//                             } as any);
//                             return;
//                         }
//                     } catch {}
//                     attempts++;
//                     await new Promise((r) => setTimeout(r, 1000));
//                 }
//                 Alert.alert("Payment not completed", "You can try again anytime.");
//             };

//             await poll();
//         } catch (error: any) {
//             Alert.alert("Payment failed", "Something went wrong. Please try again.");
//         } finally {
//             setCheckingPayment(false);
//             setBuyLoading(false);
//         }
//     };

 const handleBuy = async () => {
        if (!isSignedIn) {
            return Alert.alert(
                "Sign in required",
                "Please sign in to purchase movies",
                [
                    { text: "Sign In", onPress: () => router.push("/sign-in") },
                    { text: "Cancel", style: "cancel" },
                ]
            );
        }

        setBuyLoading(true);
        try {
            const orderRes = await api.post("/payment/create-order", { movieId: id });
            if (!orderRes.data.success) {
                Toast.show({ type: "error", text1: "Error", text2: orderRes.data.message || "Failed to create order" });
                return;
            }

            const { orderId, amount, currency, key } = orderRes.data.data;

            const options = {
                key,
                amount: String(amount),
                currency: currency || "INR",
                order_id: orderId,
                name: "A2S Cinemas",
                description: `Access: ${movie?.title}`,
                prefill: { email: user?.email || "", contact: "9999999999" },
                theme: { color: "#E50914" },
            };

            const rzpData: any = await RazorpayCheckout.open(options);

            // Verify payment with backend
            setCheckingPayment(true);
            const verifyRes = await api.post("/payment/verify", {
                razorpay_order_id: rzpData.razorpay_order_id,
                razorpay_payment_id: rzpData.razorpay_payment_id,
                razorpay_signature: rzpData.razorpay_signature,
            });

            if (verifyRes.data.success) {
                await fetchLicenses();
                await fetchMovie();
                router.replace({
                    pathname: "/payment/callback",
                    params: { status: "success", movie_id: id as string },
                } as any);
            } else {
                Toast.show({ type: "error", text1: "Verification failed", text2: "Please contact support." });
            }
        } catch (error: any) {
            // RazorpayCheckout throws on user cancel (code 0) or failure
            if (error.code === 0 || error.description?.toLowerCase().includes("cancel")) {
                Toast.show({ type: "info", text1: "Payment cancelled" });
            } else {
                Toast.show({ type: "error", text1: "Payment failed", text2: error.description || "Something went wrong." });
            }
        } finally {
            setCheckingPayment(false);
            setBuyLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </SafeAreaView>
        );
    }

    if (!movie) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>Movie not found</Text>
            </SafeAreaView>
        );
    }

    const hasMoreReviews = reviews.length < reviewsTotal;

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Poster */}
                <View style={{ height: 320, backgroundColor: "#1a1a2e", position: "relative" }}>
                    <Image
                        source={{ uri: movie.poster }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                    />
                    {/* <View style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
                        backgroundColor: "rgba(0,0,0,0.6)",
                    }} /> */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            position: "absolute", top: 52, left: 16,
                            width: 40, height: 40, borderRadius: 20,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            justifyContent: "center", alignItems: "center",
                        }}
                    >
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    {owned && (
                        <View style={{
                            position: "absolute", top: 52, right: 16,
                            backgroundColor: "#1d9e75", borderRadius: 8,
                            paddingHorizontal: 10, paddingVertical: 4,
                        }}>
                            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                                OWNED · {daysLeft}d left
                            </Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={{ padding: 16 }}>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: COLORS.primary, marginBottom: 8 }}>
                        {movie.title}
                    </Text>

                    {/* Meta row */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                        {movie.genre && (
                            <View style={{ backgroundColor: "#f0f0f0", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                                <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: "600" }}>{movie.genre}</Text>
                            </View>
                        )}
                        {movie.duration && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Ionicons name="time-outline" size={14} color={COLORS.secondary} />
                                <Text style={{ fontSize: 12, color: COLORS.secondary }}>{movie.duration} min</Text>
                            </View>
                        )}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={{ fontSize: 12, color: COLORS.secondary }}>
                                {movie.ratings.average.toFixed(1)} ({movie.ratings.count})
                            </Text>
                        </View>
                    </View>

                    {/* Access info */}
                    <View style={{
                        backgroundColor: "#f8f8f8", borderRadius: 10, padding: 12,
                        flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10,
                    }}>
                        <Ionicons name="key-outline" size={18} color={COLORS.primary} />
                        <Text style={{ fontSize: 13, color: COLORS.secondary, flex: 1 }}>
                            {owned
                                ? `You have ${daysLeft} days of access remaining`
                                : `₹${movie.price} · ${movie.expiryDays} days access`}
                        </Text>
                    </View>

                    {/* Description */}
                    <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.primary, marginBottom: 8 }}>About</Text>
                    <Text style={{ fontSize: 14, color: COLORS.secondary, lineHeight: 22, marginBottom: 24 }}>
                        {movie.description}
                    </Text>

                    {/* ── Reviews section ── */}
                    <View style={{ borderTopWidth: 0.5, borderTopColor: "#eee", paddingTop: 20 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                            <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.primary }}>
                                Reviews ({reviewsTotal})
                            </Text>
                            {owned && (
                                <TouchableOpacity
                                    onPress={() => setShowReviewModal(true)}
                                    style={{
                                        flexDirection: "row", alignItems: "center", gap: 4,
                                        backgroundColor: COLORS.accent + "15",
                                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                                    }}
                                >
                                    <Ionicons name="create-outline" size={14} color={COLORS.accent} />
                                    <Text style={{ fontSize: 12, color: COLORS.accent, fontWeight: "600" }}>
                                        {myReview ? "Edit Review" : "Write Review"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* My review status */}
                        {/* {myReview && (
                            <View style={{
                                backgroundColor: "#f0f8f0", borderRadius: 10, padding: 12,
                                marginBottom: 12, borderLeftWidth: 3, borderLeftColor: "#1d9e75",
                            }}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#1d9e75" }}>Your Review</Text>
                                    <View style={{
                                        backgroundColor: myReview.status === "approved" ? "#1d9e75" : myReview.status === "rejected" ? "#e24b4a" : "#f5a623",
                                        borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
                                    }}>
                                        <Text style={{ fontSize: 10, color: "#fff", fontWeight: "600", textTransform: "uppercase" }}>
                                            {myReview.status}
                                        </Text>
                                    </View>
                                </View>
                                <StarRating rating={myReview.rating} readonly size={14} />
                                {myReview.comment && (
                                    <Text style={{ fontSize: 13, color: COLORS.secondary, marginTop: 4 }}>
                                        {myReview.comment}
                                    </Text>
                                )}
                                {myReview.status === "pending" && (
                                    <Text style={{ fontSize: 11, color: "#f5a623", marginTop: 4 }}>
                                        Your comment is awaiting admin approval
                                    </Text>
                                )}
                            </View>
                        )} */}

                        {/* Reviews list */}
                        {reviews.length === 0 ? (
                            <Text style={{ fontSize: 14, color: COLORS.secondary, textAlign: "center", paddingVertical: 20 }}>
                                No reviews yet. Be the first to review!
                            </Text>
                        ) : (
                            <>
                                {reviews.map((review) => (
                                    <View key={review._id} style={{
                                        backgroundColor: "#f8f8f8", borderRadius: 10, padding: 12, marginBottom: 10,
                                    }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                            <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.primary }}>{review.userName}</Text>
                                            <StarRating rating={review.rating} readonly size={12} />
                                        </View>
                                        {review.comment && (
                                            <Text style={{ fontSize: 13, color: COLORS.secondary, lineHeight: 18 }}>
                                                {review.comment}
                                            </Text>
                                        )}
                                        <Text style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>
                                            {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                                day: "numeric", month: "short", year: "numeric",
                                            })}
                                        </Text>
                                    </View>
                                ))}

                                {hasMoreReviews && (
                                    <TouchableOpacity
                                        onPress={() => fetchReviews(reviewsPage + 1)}
                                        style={{ alignItems: "center", paddingVertical: 12 }}
                                    >
                                        <Text style={{ fontSize: 13, color: COLORS.accent, fontWeight: "600" }}>
                                            Load more reviews
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Sticky CTA */}
            <View style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                backgroundColor: "#fff", padding: 16,
                borderTopWidth: 0.5, borderTopColor: "#eee",
                flexDirection: "row", gap: 12,
            }}>
                {owned ? (
                    <TouchableOpacity
                        onPress={() => router.push(`/player/${movie._id}` as any)}
                        style={{
                            flex: 1, backgroundColor: COLORS.accent, borderRadius: 50,
                            paddingVertical: 16, alignItems: "center",
                            flexDirection: "row", justifyContent: "center", gap: 8,
                        }}
                    >
                        <Ionicons name="play-circle" size={22} color="#fff" />
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Watch Now</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <View style={{ flex: 1, justifyContent: "center" }}>
                            <Text style={{ fontSize: 20, fontWeight: "700", color: COLORS.primary }}>₹{movie.price}</Text>
                            <Text style={{ fontSize: 12, color: COLORS.secondary }}>{movie.expiryDays} days access</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleBuy}
                            disabled={buyLoading}
                            style={{
                                flex: 1.5, backgroundColor: COLORS.primary, borderRadius: 50,
                                paddingVertical: 16, alignItems: "center",
                                flexDirection: "row", justifyContent: "center", gap: 8,
                            }}
                        >
                            {buyLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="bag-outline" size={20} color="#fff" />
                                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Buy Access</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Payment verifying overlay */}
            {checkingPayment && (
                <View style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    justifyContent: "center", alignItems: "center", zIndex: 100,
                }}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                    <Text style={{ color: "#fff", marginTop: 12, fontSize: 14, fontWeight: "600" }}>
                        Verifying payment...
                    </Text>
                </View>
            )}

            {/* Review modal */}
            <Modal
                visible={showReviewModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowReviewModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
                        activeOpacity={1}
                        onPress={() => setShowReviewModal(false)}
                    />
                    <View style={{
                        backgroundColor: "#fff",
                        borderTopLeftRadius: 20, borderTopRightRadius: 20,
                        padding: 24, paddingBottom: 40,
                    }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.primary }}>
                                {myReview ? "Edit Your Review" : "Write a Review"}
                            </Text>
                            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.secondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Star rating */}
                        <Text style={{ fontSize: 14, color: COLORS.secondary, marginBottom: 8 }}>
                            Your Rating <Text style={{ color: "#e24b4a" }}>*</Text>
                        </Text>
                        <View style={{ marginBottom: 20 }}>
                            <StarRating rating={reviewRating} onRate={setReviewRating} size={36} />
                            {reviewRating > 0 && (
                                <Text style={{ fontSize: 12, color: COLORS.secondary, marginTop: 6 }}>
                                    {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewRating]}
                                </Text>
                            )}
                        </View>

                        {/* Comment */}
                        <Text style={{ fontSize: 14, color: COLORS.secondary, marginBottom: 8 }}>
                            Comment (optional — requires approval)
                        </Text>
                        <TextInput
                            value={reviewComment}
                            onChangeText={setReviewComment}
                            placeholder="Share your thoughts about this movie..."
                            placeholderTextColor="#bbb"
                            multiline
                            numberOfLines={4}
                            maxLength={1000}
                            style={{
                                borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 10,
                                padding: 12, fontSize: 14, color: COLORS.primary,
                                textAlignVertical: "top", minHeight: 100,
                                marginBottom: 8,
                            }}
                        />
                        <Text style={{ fontSize: 11, color: "#bbb", marginBottom: 20, textAlign: "right" }}>
                            {reviewComment.length}/1000
                        </Text>

                        <TouchableOpacity
                            onPress={handleSubmitReview}
                            disabled={submittingReview || reviewRating === 0}
                            style={{
                                backgroundColor: reviewRating === 0 ? "#ccc" : COLORS.accent,
                                borderRadius: 50, paddingVertical: 16, alignItems: "center",
                            }}
                        >
                            {submittingReview ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                                    {myReview ? "Update Review" : "Submit Review"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}