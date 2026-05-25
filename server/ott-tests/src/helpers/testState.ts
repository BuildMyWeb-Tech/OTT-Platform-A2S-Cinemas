import * as fs from "fs";
import * as path from "path";

const STATE_FILE = path.join(__dirname, "../../.test-state.json");

const defaultState = {
  userToken: "",
  adminToken: "",
  userId: "",
  adminId: "",
  movieId: "",
  categoryId: "",
  purchaseId: "",
  licenseId: "",
  razorpayOrderId: "",
};

// Load state from file if it exists
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch {}
  return { ...defaultState };
}

// Save state to file
export function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export const state = loadState();

export const BASE_URL = process.env.BASE_URL || "http://localhost:5000/api";

export const TEST_USER = {
  name: "Jest Test User",
  email: "jest_user_fixed@test.com",
  password: "testpassword123",
};

export const TEST_ADMIN = {
  name: "Jest Admin User",
  email: "jest_admin_fixed@test.com",
  password: "adminpassword123",
};

export const TEST_MOVIE = {
  title: "Jest Test Movie",
  description: "An automated test movie for the OTT platform testing suite",
  genre: "Action",
  price: 99,
  poster: "https://test-bucket.s3.ap-south-1.amazonaws.com/posters/test.jpg",
  videoKey: "videos/test-video.mp4",
  expiryDays: 30,
  duration: 120,
  isFeatured: true,
};

export const TEST_CATEGORY = {
  name: "TestGenreFixed",
  description: "Test category for automated testing",
};