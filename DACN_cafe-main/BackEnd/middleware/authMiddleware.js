const checkLogin = (req, res, next) => {
  if (!req.session.user)
    return res.status(401).json({ message: "Vui lòng đăng nhập!" });
  next();
};

const isAdmin = (req, res, next) => {
  if (req.session.user.role === "Admin") {
    next();
  } else {
    res.status(403).json({ message: "Quyền truy cập chỉ dành cho Quản lý!" });
  }
};

module.exports = { checkLogin, isAdmin };
