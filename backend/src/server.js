import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

import userRoutes from "./routes/user.route.js";
import orderRoutes from "./routes/order.route.js";
import notificationRoutes from "./routes/notification.route.js";
import chatRoutes from "./routes/chat.route.js";
import messageRoutes from "./routes/message.route.js";
import productRoutes from "./routes/product.route.js";
import { createServer } from "http";
import { initializeSocket } from "./utils/socket.js";

const app = express();

const httpServer = createServer(app);

initializeSocket(httpServer);

// cho phép tất cả domain gửi yêu cầu đến server và phân tích cú pháp JSON trong body của yêu cầu. Điều này rất hữu ích khi bạn xây dựng API RESTful hoặc làm việc với dữ liệu JSON từ phía client.
app.use(cors({
  origin: "*"
}));

app.use(express.json()); 
app.use(clerkMiddleware()); // dùng để gắn hệ thống xác thực của Clerk vào backend Express của bạn. Điều này cho phép bạn dễ dàng quản lý người dùng, xác thực và phân quyền trong ứng dụng của mình bằng cách sử dụng các tính năng mà Clerk cung cấp. Khi bạn sử dụng middleware này, nó sẽ tự động xử lý các yêu cầu liên quan đến xác thực và cung cấp thông tin người dùng đã đăng nhập cho các route khác trong ứng dụng của bạn.

app.get("/test", (req, res) =>
  res.status(200).json({ message: "Test endpoint is working" }),
);

app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);


// error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

connectDB();

httpServer.listen(ENV.PORT, () => {
  console.log("Server running on", ENV.PORT);
});


export default app;
