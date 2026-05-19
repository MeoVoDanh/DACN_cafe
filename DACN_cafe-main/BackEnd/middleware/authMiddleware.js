import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Thiếu token, vui lòng đăng nhập",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token không hợp lệ",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({
      message: "Token hết hạn hoặc không hợp lệ",
      error: error.message,
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    if (!roles.includes(req.user.vaiTro)) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập chức năng này",
      });
    }

    next();
  };
};
