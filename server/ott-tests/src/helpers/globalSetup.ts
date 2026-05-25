import axios from "axios";
import { state, BASE_URL, TEST_USER, TEST_ADMIN, saveState } from "./testState";

const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

export async function setupTokens() {
  // Try register user, fall back to login if already exists
  let res = await api.post("/auth/register", TEST_USER);
  if (res.status === 201) {
    state.userToken = res.data.token;
    state.userId = res.data.data._id;
  } else {
    const loginRes = await api.post("/auth/login", {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    if (loginRes.status === 200) {
      state.userToken = loginRes.data.token;
      state.userId = loginRes.data.data._id;
    }
  }

  // Try register admin, fall back to login if already exists
  let adminRes = await api.post("/auth/register", TEST_ADMIN);
  if (adminRes.status === 201) {
    state.adminToken = adminRes.data.token;
    state.adminId = adminRes.data.data._id;
  } else {
    const adminLoginRes = await api.post("/auth/login", {
      email: TEST_ADMIN.email,
      password: TEST_ADMIN.password,
    });
    if (adminLoginRes.status === 200) {
      state.adminToken = adminLoginRes.data.token;
      state.adminId = adminLoginRes.data.data._id;
    }
  }

  // Write tokens to disk so other test files can read them
  saveState();

  console.log(`✅ userToken: ${state.userToken ? "OK" : "FAILED"}`);
  console.log(`✅ adminToken: ${state.adminToken ? "OK" : "FAILED"}`);
}