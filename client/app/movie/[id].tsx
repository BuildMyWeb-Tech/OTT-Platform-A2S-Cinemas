import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator, Alert, Dimensions, Image,
    KeyboardAvoidingView, Modal, Platform, ScrollView,
    Share, StatusBar, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "@/constants/api";
import { Movie, Review, MyReview } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { useLicense } from "@/context/LicenseContext";
import { useTheme } from "@/context/ThemeContext";
import Toast from "react-native-toast-message";
import RazorpayCheckout from "react-native-razorpay";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.48;

// ── STAR RATING ───────────────────────────────────────────────────────────────
function StarRating({ rating, onRate, size = 20, readonly = false }: {
    rating: number; onRate?: (r: number) => void; size?: number; readonly?: boolean;
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
                        color={star <= rating ? "#FFD700" : "#666"}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ── ACTION BUTTON ─────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, onPress, colors }: {
    icon: string; label: string; onPress: () => void; colors: any;
}) {
    return (
        <TouchableOpacity onPress={onPress} style={{ alignItems: "center", gap: 6 }}>
            <View style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: colors.surfaceVariant,
                borderWidth: 0.5, borderColor: colors.border,
                justifyContent: "center", alignItems: "center",
            }}>
                <Ionicons name={icon as any} size={20} color={colors.textSecondary} />
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "500" }}>{label}</Text>
        </TouchableOpacity>
    );
}

export default function MovieDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const { user, isSignedIn } = useAuth();
    const { hasLicense, getDaysLeft, fetchLicenses } = useLicense();

    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [buyLoading, setBuyLoading] = useState(false);
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);

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
            if (page === 1) setReviews(data.data);
            else setReviews((prev) => [...prev, ...data.data]);
            setReviewsTotal(data.pagination.total);
            setReviewsPage(page);
        } catch {}
    };

    const fetchMyReview = async () => {
        try {
            const { data } = await api.get(`/reviews/my/${id}`);
            if (data.data) {
                setMyReview(data.data);
                setReviewRating(data.data.rating);
                setReviewComment(data.data.comment || "");
            }
        } catch {}
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
            Toast.show({ type: "success", text1: "Review submitted!" });
        } catch (error: any) {
            Toast.show({
                type: "error", text1: "Failed",
                text2: error.response?.data?.message || "Could not submit review",
            });
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleBuy = async () => {
        if (!isSignedIn) {
            return Alert.alert("Sign in required", "Please sign in to purchase movies", [
                { text: "Sign In", onPress: () => router.push("/sign-in") },
                { text: "Cancel", style: "cancel" },
            ]);
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
                key, amount: String(amount), currency: currency || "INR",
                order_id: orderId, name: "A2S Cinemas",
                description: `Access: ${movie?.title}`,
                prefill: { email: user?.email || "", contact: "9999999999" },
                theme: { color: "#E50914" },
            };
            const rzpData: any = await RazorpayCheckout.open(options);
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

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Watch "${movie?.title}" on A2S Cinemas!`,
                title: movie?.title,
            });
        } catch {}
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    if (!movie) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="film-outline" size={56} color={colors.textMuted} />
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "600", marginTop: 16 }}>
                    Movie not found
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: colors.accent, fontSize: 15, fontWeight: "600" }}>Go back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const categoryLabel = (movie.categories && movie.categories.length > 0)
        ? movie.categories.map((c: any) => c.name).join(" • ")
        : movie.genre;
    const hasMoreReviews = reviews.length < reviewsTotal;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                {/* ── HERO IMAGE ── */}
                <View style={{ height: HERO_HEIGHT, position: "relative" }}>
                    <Image
                        source={{ uri: movie.poster }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                    />

                    {/* Multi-layer gradient for smooth bleed into background */}
                    <LinearGradient
                        colors={["rgba(0,0,0,0.15)", "transparent", isDark ? "rgba(10,10,15,0.95)" : "rgba(255,255,255,0.95)"]}
                        locations={[0, 0.4, 1]}
                        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                    />

                    {/* Back button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            position: "absolute", top: insets.top + 10, left: 16,
                            width: 40, height: 40, borderRadius: 20,
                            backgroundColor: "rgba(0,0,0,0.55)",
                            justifyContent: "center", alignItems: "center",
                        }}
                    >
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>

                    {/* Owned badge */}
                    {owned && (
                        <View style={{
                            position: "absolute", top: insets.top + 10, right: 16,
                            backgroundColor: "#1D9E75",
                            borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5,
                        }}>
                            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                                ✓ OWNED · {daysLeft}d left
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── MOVIE INFO ── */}
                <View style={{ paddingHorizontal: 20, marginTop: -8 }}>

                    {/* Title */}
                    <Text style={{
                        fontSize: 26, fontWeight: "800", color: colors.textPrimary,
                        marginBottom: 10, lineHeight: 32, letterSpacing: 0.3,
                    }}>
                        {movie.title}
                    </Text>

                    {/* Meta chips row */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 16 }}
                        contentContainerStyle={{ gap: 8 }}
                    >
                        {/* Category */}
                        {categoryLabel && (
                            <MetaChip icon="pricetag-outline" label={categoryLabel} colors={colors} />
                        )}
                        {/* Duration */}
                        {movie.duration && (
                            <MetaChip icon="time-outline" label={`${movie.duration} min`} colors={colors} />
                        )}
                        {/* Rating */}
                        {movie.ratings?.average > 0 && (
                            <MetaChip
                                icon="star"
                                label={`${movie.ratings.average.toFixed(1)} (${movie.ratings.count})`}
                                colors={colors}
                                iconColor="#FFD700"
                            />
                        )}
                        {/* Access days */}
                        <MetaChip icon="key-outline" label={`${movie.expiryDays}d access`} colors={colors} />
                    </ScrollView>

                    {/* ── CTA BUTTONS ── */}
                    {owned ? (
                        <TouchableOpacity
                            onPress={() => router.push(`/player/${movie._id}` as any)}
                            style={{
                                backgroundColor: colors.accent, borderRadius: 12,
                                paddingVertical: 16, marginBottom: 12,
                                flexDirection: "row", alignItems: "center",
                                justifyContent: "center", gap: 10,
                            }}
                        >
                            <Ionicons name="play-circle" size={24} color="#fff" />
                            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>Watch Now</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary }}>
                                    ₹{movie.price}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
                                    {movie.expiryDays} days access
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleBuy}
                                disabled={buyLoading}
                                style={{
                                    flex: 2, backgroundColor: colors.accent, borderRadius: 12,
                                    paddingVertical: 14,
                                    flexDirection: "row", alignItems: "center",
                                    justifyContent: "center", gap: 8,
                                }}
                            >
                                {buyLoading
                                    ? <ActivityIndicator color="#fff" />
                                    : <>
                                        <Ionicons name="card-outline" size={20} color="#fff" />
                                        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Buy Access</Text>
                                    </>
                                }
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── ACTION ICONS ROW ── */}
                    <View style={{
                        flexDirection: "row", justifyContent: "space-around",
                        paddingVertical: 16, marginBottom: 20,
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        borderWidth: 0.5, borderColor: colors.border,
                    }}>
                        <ActionBtn
                            icon="add-circle-outline"
                            label="Watchlist"
                            onPress={() => Toast.show({ type: "info", text1: "Coming soon" })}
                            colors={colors}
                        />
                        <ActionBtn
                            icon="share-social-outline"
                            label="Share"
                            onPress={handleShare}
                            colors={colors}
                        />
                        <ActionBtn
                            icon="download-outline"
                            label="Download"
                            onPress={() => Toast.show({ type: "info", text1: "Coming soon" })}
                            colors={colors}
                        />
                        {owned && (
                            <ActionBtn
                                icon="create-outline"
                                label={myReview ? "Edit Review" : "Review"}
                                onPress={() => setShowReviewModal(true)}
                                colors={colors}
                            />
                        )}
                    </View>

                    {/* ── DESCRIPTION ── */}
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 10 }}>
                        About
                    </Text>
                    <Text
                        style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 4 }}
                        numberOfLines={descExpanded ? undefined : 3}
                    >
                        {movie.description}
                    </Text>
                    {movie.description && movie.description.length > 120 && (
                        <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} style={{ marginBottom: 24 }}>
                            <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
                                {descExpanded ? "Show less" : "Read more"}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* ── REVIEWS SECTION ── */}
                    <View style={{
                        borderTopWidth: 0.5, borderTopColor: colors.divider, paddingTop: 20
                    }}>
                        <View style={{
                            flexDirection: "row", alignItems: "center",
                            justifyContent: "space-between", marginBottom: 16,
                        }}>
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
                                    Reviews
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                                    {reviewsTotal} review{reviewsTotal !== 1 ? "s" : ""}
                                </Text>
                            </View>

                            {/* Rating summary */}
                            {movie.ratings?.average > 0 && (
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={{ fontSize: 28, fontWeight: "800", color: colors.textPrimary, lineHeight: 30 }}>
                                        {movie.ratings.average.toFixed(1)}
                                    </Text>
                                    <StarRating rating={Math.round(movie.ratings.average)} readonly size={12} />
                                </View>
                            )}
                        </View>

                        {reviews.length === 0 ? (
                            <View style={{
                                alignItems: "center", paddingVertical: 32,
                                backgroundColor: colors.surface, borderRadius: 14,
                                borderWidth: 0.5, borderColor: colors.border, marginBottom: 16,
                            }}>
                                <Ionicons name="chatbubble-outline" size={32} color={colors.textMuted} />
                                <Text style={{ color: colors.textMuted, marginTop: 10, fontSize: 14 }}>
                                    No reviews yet
                                </Text>
                                {owned && (
                                    <TouchableOpacity
                                        onPress={() => setShowReviewModal(true)}
                                        style={{ marginTop: 12 }}
                                    >
                                        <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
                                            Be the first to review
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <>
                                {reviews.map((review) => (
                                    <ReviewCard key={review._id} review={review} colors={colors} />
                                ))}
                                {hasMoreReviews && (
                                    <TouchableOpacity
                                        onPress={() => fetchReviews(reviewsPage + 1)}
                                        style={{
                                            alignItems: "center", paddingVertical: 14,
                                            backgroundColor: colors.surface,
                                            borderRadius: 10, marginTop: 4,
                                            borderWidth: 0.5, borderColor: colors.border,
                                        }}
                                    >
                                        <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "600" }}>
                                            Load more reviews
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* ── PAYMENT VERIFYING OVERLAY ── */}
            {checkingPayment && (
                <View style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.82)",
                    justifyContent: "center", alignItems: "center", zIndex: 100,
                }}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={{ color: "#fff", marginTop: 16, fontSize: 15, fontWeight: "600" }}>
                        Verifying payment...
                    </Text>
                </View>
            )}

            {/* ── REVIEW MODAL ── */}
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
                        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
                        activeOpacity={1}
                        onPress={() => setShowReviewModal(false)}
                    />
                    <View style={{
                        backgroundColor: colors.surface,
                        borderTopLeftRadius: 24, borderTopRightRadius: 24,
                        paddingBottom: 32, maxHeight: "82%",
                    }}>
                        {/* Handle */}
                        <View style={{
                            width: 36, height: 4, borderRadius: 2,
                            backgroundColor: colors.border,
                            alignSelf: "center", marginVertical: 12,
                        }} />

                        <View style={{
                            flexDirection: "row", alignItems: "center",
                            justifyContent: "space-between",
                            paddingHorizontal: 24, paddingBottom: 16,
                            borderBottomWidth: 0.5, borderBottomColor: colors.divider,
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>
                                {myReview ? "Edit Your Review" : "Write a Review"}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowReviewModal(false)}
                                style={{
                                    width: 30, height: 30, borderRadius: 15,
                                    backgroundColor: colors.surfaceVariant,
                                    justifyContent: "center", alignItems: "center",
                                }}
                            >
                                <Ionicons name="close" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 }}
                        >
                            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 10 }}>
                                Your Rating <Text style={{ color: colors.accent }}>*</Text>
                            </Text>
                            <View style={{ marginBottom: 8 }}>
                                <StarRating rating={reviewRating} onRate={setReviewRating} size={36} />
                            </View>
                            {reviewRating > 0 && (
                                <Text style={{ fontSize: 13, color: colors.accent, marginBottom: 20, fontWeight: "600" }}>
                                    {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewRating]}
                                </Text>
                            )}

                            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
                                Comment (optional)
                            </Text>
                            <TextInput
                                value={reviewComment}
                                onChangeText={setReviewComment}
                                placeholder="Share your thoughts..."
                                placeholderTextColor={colors.inputPlaceholder}
                                multiline
                                numberOfLines={4}
                                maxLength={1000}
                                style={{
                                    backgroundColor: colors.inputBg,
                                    borderWidth: 1, borderColor: colors.inputBorder,
                                    borderRadius: 12, padding: 14,
                                    fontSize: 14, color: colors.inputText,
                                    textAlignVertical: "top", minHeight: 100,
                                    marginBottom: 8,
                                }}
                            />
                            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 20, textAlign: "right" }}>
                                {reviewComment.length}/1000
                            </Text>

                            <TouchableOpacity
                                onPress={handleSubmitReview}
                                disabled={submittingReview || reviewRating === 0}
                                style={{
                                    backgroundColor: reviewRating === 0 ? colors.surfaceVariant : colors.accent,
                                    borderRadius: 12, paddingVertical: 16,
                                    alignItems: "center", marginBottom: 8,
                                }}
                            >
                                {submittingReview
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={{
                                        color: reviewRating === 0 ? colors.textMuted : "#fff",
                                        fontWeight: "700", fontSize: 16,
                                    }}>
                                        {myReview ? "Update Review" : "Submit Review"}
                                    </Text>
                                }
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

// ── META CHIP ─────────────────────────────────────────────────────────────────
function MetaChip({ icon, label, colors, iconColor }: {
    icon: string; label: string; colors: any; iconColor?: string;
}) {
    return (
        <View style={{
            flexDirection: "row", alignItems: "center", gap: 5,
            backgroundColor: colors.surfaceVariant,
            borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
            borderWidth: 0.5, borderColor: colors.border,
        }}>
            <Ionicons name={icon as any} size={13} color={iconColor || colors.textMuted} />
            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "500" }}>
                {label}
            </Text>
        </View>
    );
}

// ── REVIEW CARD ───────────────────────────────────────────────────────────────
function ReviewCard({ review, colors }: { review: Review; colors: any }) {
    return (
        <View style={{
            backgroundColor: colors.card,
            borderRadius: 12, padding: 14, marginBottom: 10,
            borderWidth: 0.5, borderColor: colors.border,
        }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{
                        width: 34, height: 34, borderRadius: 17,
                        backgroundColor: colors.accent + "25",
                        justifyContent: "center", alignItems: "center",
                    }}>
                        <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "700" }}>
                            {review.userName?.charAt(0)?.toUpperCase() || "U"}
                        </Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>
                            {review.userName}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                            {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                            })}
                        </Text>
                    </View>
                </View>
                <StarRating rating={review.rating} readonly size={13} />
            </View>
            {review.comment && (
                <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: 4 }}>
                    {review.comment}
                </Text>
            )}
        </View>
    );
}