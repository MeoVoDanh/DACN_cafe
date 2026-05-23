import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(`[verifyToken] Request URL: ${req.method} ${req.originalUrl}`);
  console.log(`[verifyToken] Authorization Header:`, authHeader);

  if (!authHeader) {
    console.log(`[verifyToken] Failed: Missing Authorization header`);
    return res.status(401).json({
      message: "Thiếu token, vui lòng đăng nhập",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    console.log(`[verifyToken] Failed: Token is empty`);
    return res.status(401).json({
      message: "Token không hợp lệ",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[verifyToken] Success: Decoded user:`, decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(`[verifyToken] Error: Verification failed:`, error.message);
    return res.status(403).json({
      message: "Token hết hạn hoặc không hợp lệ",
      error: error.message,
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log(`[authorizeRoles] Roles allowed:`, roles);
    console.log(`[authorizeRoles] Current user role:`, req.user?.vaiTro);
    
    if (!req.user) {
      console.log(`[authorizeRoles] Failed: req.user is undefined`);
      return res.status(401).json({
        message: "Bạn chưa đăng nhập",
      });
    }

    if (!roles.includes(req.user.vaiTro)) {
      console.log(`[authorizeRoles] Failed: user role "${req.user.vaiTro}" not allowed`);
      return res.status(403).json({
        message: "Bạn không có quyền truy cập chức năng này",
      });
    }

    console.log(`[authorizeRoles] Success`);
    next();
  };
};
