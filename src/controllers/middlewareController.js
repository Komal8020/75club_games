import connection from "../config/connectDB.js";

const middlewareController = async (req, res, next) => {
  // xác nhận token
  const auth = req.cookies.auth;

  // if (!auth) return res.redirect("/login");
  try {
    const [rows] = await connection.query(
      "SELECT `token`, `status` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [auth],
    );

    if (!rows) {
      res.clearCookie("auth");
      return res.end();
    }

    if (auth == rows[0].token && rows[0].status == "1") {
      req.userToken = auth;
      next();
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    return res.redirect("/login");
  }
};

export default middlewareController;
