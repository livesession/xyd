import express from "express";
import { randomUUID } from "crypto";

type Role = "user" | "admin" | "moderator";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  address?: { street?: string };
}

const app = express();
app.use(express.json());

const startedAt = Date.now();

const users: User[] = [
  {
    id: randomUUID(),
    email: "alice@example.com",
    firstName: "Alice",
    lastName: "Anderson",
    role: "admin",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    address: { street: "123 Main St" },
  },
  {
    id: randomUUID(),
    email: "bob@example.com",
    firstName: "Bob",
    lastName: "Brown",
    role: "user",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Health
app.get("/v1/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime: (Date.now() - startedAt) / 1000,
  });
});

// Auth
app.post("/v1/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res
      .status(400)
      .json({
        error: "Invalid body",
        code: "BAD_REQUEST",
        timestamp: new Date().toISOString(),
      });
  }
  const user = users.find((u) => u.email === email);
  if (!user) {
    return res
      .status(401)
      .json({
        error: "Invalid credentials",
        code: "UNAUTHORIZED",
        timestamp: new Date().toISOString(),
      });
  }
  res.json({
    accessToken: "access-" + randomUUID(),
    refreshToken: "refresh-" + randomUUID(),
    expiresIn: 3600,
    user,
  });
});

app.post("/v1/auth/refresh", (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res
      .status(401)
      .json({
        error: "Invalid refresh token",
        code: "UNAUTHORIZED",
        timestamp: new Date().toISOString(),
      });
  }
  res.json({
    accessToken: "access-" + randomUUID(),
    refreshToken: "refresh-" + randomUUID(),
    expiresIn: 3600,
    user: users[0],
  });
});

// Users list/create
app.get("/v1/users", (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20)
  );
  const search = String(req.query.search ?? "").toLowerCase();
  const filtered = search
    ? users.filter((u) =>
        [u.email, u.firstName, u.lastName].some((v) =>
          (v ?? "").toLowerCase().includes(search)
        )
      )
    : users;

  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  res.json({ data, pagination: { page, limit, total, totalPages } });
});

app.post("/v1/users", (req, res) => {
  const { email, password, firstName, lastName, role } = req.body || {};
  if (!email || !password || !firstName || !lastName) {
    return res
      .status(400)
      .json({
        error: "Missing required fields",
        code: "BAD_REQUEST",
        timestamp: new Date().toISOString(),
      });
  }
  if (users.some((u) => u.email === email)) {
    return res
      .status(409)
      .json({
        error: "User already exists",
        code: "CONFLICT",
        timestamp: new Date().toISOString(),
      });
  }
  const now = new Date().toISOString();
  const user: User = {
    id: randomUUID(),
    email,
    firstName,
    lastName,
    role: (role as Role) ?? "user",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  users.push(user);
  res.status(201).json(user);
});

// Users get/update/delete by id
app.get("/v1/users/:userId", (req, res) => {
  const user = users.find((u) => u.id === req.params.userId);
  if (!user)
    return res
      .status(404)
      .json({
        error: "User not found",
        code: "NOT_FOUND",
        timestamp: new Date().toISOString(),
      });
  res.json(user);
});

app.put("/v1/users/:userId", (req, res) => {
  const user = users.find((u) => u.id === req.params.userId);
  if (!user)
    return res
      .status(404)
      .json({
        error: "User not found",
        code: "NOT_FOUND",
        timestamp: new Date().toISOString(),
      });
  const { firstName, lastName, role, isActive } = req.body || {};
  if (typeof firstName === "string") user.firstName = firstName;
  if (typeof lastName === "string") user.lastName = lastName;
  if (role === "user" || role === "admin" || role === "moderator")
    user.role = role;
  if (typeof isActive === "boolean") user.isActive = isActive;
  user.updatedAt = new Date().toISOString();
  res.json(user);
});

app.delete("/v1/users/:userId", (req, res) => {
  const index = users.findIndex((u) => u.id === req.params.userId);
  if (index === -1)
    return res
      .status(404)
      .json({
        error: "User not found",
        code: "NOT_FOUND",
        timestamp: new Date().toISOString(),
      });
  users.splice(index, 1);
  res.status(204).send();
});

const port = Number(process.env.PORT || 5050);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Demo API listening at http://localhost:${port}/v1`);
});
