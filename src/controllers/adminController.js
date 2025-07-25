import connection from "../config/connectDB.js";
import md5 from "md5";
import {
  REWARD_STATUS_TYPES_MAP,
  REWARD_TYPES_MAP,
} from "../constants/reward_types.js";
import {
  generateClaimRewardID,
  getBonuses,
  yesterdayTime, 
} from "../helpers/games.js";
import e from "express";
import moment from "moment";
import bcrypt from "bcrypt";
const saltRounds = parseInt(process.env.SALT_ROUNDS || 5);

let timeNow = Date.now();

const adminPage = async (req, res) => {
  return res.render("manage/index.ejs");
};

const adminPage3 = async (req, res) => {
  return res.render("manage/a-index-bet/index3.ejs");
};

const adminPage5 = async (req, res) => {
  return res.render("manage/a-index-bet/index5.ejs");
};

const adminPage10 = async (req, res) => {
  return res.render("manage/a-index-bet/index10.ejs");
};

const adminPage5d = async (req, res) => {
  return res.render("manage/5d.ejs");
};

const adminPageK3 = async (req, res) => {
  return res.render("manage/k3.ejs");
};

const ctvProfilePage = async (req, res) => {
  var phone = req.params.phone;
  return res.render("manage/profileCTV.ejs", { phone });
};

const giftPage = async (req, res) => {
  return res.render("manage/giftPage.ejs");
};

const membersPage = async (req, res) => {
  return res.render("manage/members.ejs");
};

const ctvPage = async (req, res) => {
  return res.render("manage/ctv.ejs");
};

const infoMember = async (req, res) => {
  let phone = req.params.id;
  return res.render("manage/profileMember.ejs", { phone });
};

const statistical = async (req, res) => {
  return res.render("manage/statistical.ejs");
};

const rechargePage = async (req, res) => {
  return res.render("manage/recharge.ejs");
};

const rechargeRecord = async (req, res) => {
  return res.render("manage/rechargeRecord.ejs");
};

const withdraw = async (req, res) => {
  return res.render("manage/withdraw.ejs");
};

const levelSetting = async (req, res) => {
  return res.render("manage/levelSetting.ejs");
};

const CreatedSalaryRecord = async (req, res) => {
  return res.render("manage/CreatedSalaryRecord.ejs");
};

const DailySalaryEligibility = async (req, res) => {
  return res.render("manage/DailySalaryEligibility.ejs");
};

const withdrawRecord = async (req, res) => {
  return res.render("manage/withdrawRecord.ejs");
};
const settings = async (req, res) => {
  return res.render("manage/settings.ejs");
};

const Wallets = async (req, res) => {
  return res.render("manage/Wallet.ejs");
};
const addmoney = async (req, res) => {
  return res.render("manage/addmoney.ejs");
};
const financeManager = async (req, res) => {
  return res.render("manage/financeManager.ejs");
};
const demoUser = async (req, res) => {
  return res.render("manage/demoUser.ejs");
};

// xác nhận admin
const middlewareAdminController = async (req, res, next) => {
  // xác nhận token
  const auth = req.cookies.auth;
  if (!auth) {
    return res.redirect("/login");
  }
  const [rows] = await connection.query(
    "SELECT `token`,`level`, `status` FROM `users` WHERE `token` = ? AND veri = 1",
    [auth],
  );
  if (!rows) {
    return res.redirect("/login");
  }
  try {
    if (auth == rows[0].token && rows[0].status == 1) {
      if (rows[0].level == 1) {
        next();
      } else {
        return res.redirect("/home");
      }
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    return res.redirect("/login");
  }
};

const totalJoin = async (req, res) => {
  let auth = req.cookies.auth;
  let typeid = req.body.typeid;
  if (!typeid) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let game = "";
  if (typeid == "1") game = "wingo";
  if (typeid == "2") game = "wingo3";
  if (typeid == "3") game = "wingo5";
  if (typeid == "4") game = "wingo10";

  const [rows] = await connection.query(
    "SELECT * FROM users WHERE `token` = ? ",
    [auth],
  );

  if (rows.length > 0) {
    const [wingoall] = await connection.query(
      `SELECT * FROM minutes_1 WHERE game = "${game}" AND status = 0 AND level = 0 ORDER BY id ASC `,
      [auth],
    );
    const [winGo1] = await connection.execute(
      `SELECT * FROM wingo WHERE status = 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `,
      [],
    );
    const [winGo10] = await connection.execute(
      `SELECT * FROM wingo WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT 10 `,
      [],
    );
    const [setting] = await connection.execute(`SELECT * FROM admin_ac `, []);

    return res.status(200).json({
      message: "Success",
      status: true,
      datas: wingoall,
      lotterys: winGo1,
      list_orders: winGo10,
      setting: setting,
      timeStamp: timeNow,
    });
  } else {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
};

const listMember = async (req, res) => {
  let { pageno, limit, search } = req.body;
  const offset = (pageno - 1) * limit;

  if (!pageno || !limit) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || limit < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  let sql = "SELECT * FROM users WHERE veri = 1 AND level != 2";
  let countSql =
    "SELECT COUNT(*) as total FROM users WHERE veri = 1 AND level != 2";
  let params = [];

  if (search) {
    sql += " AND (phone LIKE ? OR id_user LIKE ?)";
    countSql += " AND (phone LIKE ? OR phone LIKE ?)";
    params = [`%${search}%`, `%${search}%`];
  }

  sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  // Execute the query to fetch users
  const [users] = await connection.execute(sql, params);

  const [total_users] = await connection.query(countSql, params.slice(0, -2));

  // const [users] = await connection.execute(
  //    "SELECT * FROM users WHERE veri = 1 AND level != 2 ORDER BY id DESC LIMIT ? OFFSET ?",
  //    [limit, offset]
  //  );
  //  const [total_users] = await connection.query(`SELECT * FROM users WHERE veri = 1 AND level != 2`)
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: users,
    currentPage: pageno,
    page_total: Math.ceil(total_users[0].total / limit),
  });
};
const listdemoMember = async (req, res) => {
  let { pageno, limit, search } = req.body;
  const offset = (pageno - 1) * limit;

  if (!pageno || !limit) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || limit < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  let sql = "SELECT * FROM users WHERE veri = 1 AND level != 2 AND isdemo=1";
  let countSql =
    "SELECT COUNT(*) as total FROM users WHERE veri = 1 AND level != 2  AND isdemo=1";
  let params = [];

  if (search) {
    sql += " AND (phone LIKE ? OR id_user LIKE ?)";
    countSql += " AND (phone LIKE ? OR phone LIKE ?)";
    params = [`%${search}%`, `%${search}%`];
  }

  sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  // Execute the query to fetch users
  const [users] = await connection.execute(sql, params);

  const [total_users] = await connection.query(countSql, params.slice(0, -2));

  // const [users] = await connection.execute(
  //    "SELECT * FROM users WHERE veri = 1 AND level != 2 ORDER BY id DESC LIMIT ? OFFSET ?",
  //    [limit, offset]
  //  );
  //  const [total_users] = await connection.query(`SELECT * FROM users WHERE veri = 1 AND level != 2`)
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: users,
    currentPage: pageno,
    page_total: Math.ceil(total_users[0].total / limit),
  });
};

const listCTV = async (req, res) => {
  let { pageno, pageto } = req.body;

  if (!pageno || !pageto) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || pageto < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }
  const [wingo] = await connection.query(
    `SELECT * FROM users WHERE veri = 1 AND level = 2 ORDER BY id DESC LIMIT ${pageno}, ${pageto} `,
  );
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: wingo,
  });
};

function formateT2(params) {
  let result = params < 10 ? "0" + params : params;
  return result;
}


function timerJoin2(params = "", addHours = 0) {
  let date = "";
  if (params) {
    date = new Date(Number(params));
  } else {
    date = new Date();
  }

  date.setHours(date.getHours() + addHours);

  let years = formateT(date.getFullYear());
  let months = formateT(date.getMonth() + 1);
  let days = formateT(date.getDate());

  let hours = date.getHours() % 12;
  hours = hours === 0 ? 12 : hours;

  return (
    years +
    "-" +
    days +
    "-" +
    months
  );
}

function timerJoin23(params = "", addHours = 0) {
  let date = "";
  if (params) {
    date = new Date(Number(params));
  } else {
    date = new Date();
  }

  date.setHours(date.getHours() + addHours);

  let years = formateT(date.getFullYear());
  let months = formateT(date.getMonth() + 1);
  let days = formateT(date.getDate());

  let hours = date.getHours() % 12;
  hours = hours === 0 ? 12 : hours;

  return (
    years +
    "-" +
    months +
    "-" +
    days
  );
}

const statistical2 = async (req, res) => {
  const sumdate = timerJoinFun(Date.now())
  const [wingo] = await connection.query(
    `SELECT SUM(money) as total FROM minutes_1 WHERE status = 1 AND isdemo=0 `,
  );
  const [wingo2] = await connection.query(
    `SELECT SUM(money) as total FROM minutes_1 WHERE status = 2 AND isdemo=0  `,
  );
  const [users] = await connection.query(
    `SELECT COUNT(id) as total FROM users WHERE status = 1 `,
  );
  const [users2] = await connection.query(
    `SELECT COUNT(id) as total FROM users WHERE status = 0 `,
  );
  const [recharge] = await connection.query(
    `SELECT SUM(money) as total FROM recharge WHERE status = 1  AND isdemo=0 `,
  );
  const [withdraw] = await connection.query(
    `SELECT SUM(money) as total FROM withdraw WHERE status = 1 AND isdemo=0  `,
  );

  const [recharge_today] = await connection.query(
    `SELECT SUM(money) as total FROM recharge WHERE status = 1 AND DATE(bet_data) = ? AND isdemo=0 `,
    [sumdate],
  );
  const [withdraw_today] = await connection.query(
    `SELECT SUM(money) as total FROM withdraw WHERE status = 1 AND DATE(today) = ? AND isdemo=0 `,
    [sumdate],
  );

  let win = wingo[0].total;
  let loss = wingo2[0].total;
  let usersOnline = users[0].total;
  let usersOffline = users2[0].total;
  let recharges = recharge[0].total;
  let withdraws = withdraw[0].total;
  return res.status(200).json({
    message: "Success",
    status: true,
    win: win,
    loss: loss,
    usersOnline: usersOnline,
    usersOffline: usersOffline,
    recharges: recharges,
    withdraws: withdraws,
    rechargeToday: recharge_today[0].total,
    withdrawToday: withdraw_today[0].total,
  });
};

const changeAdmin = async (req, res) => {
  let auth = req.cookies.auth;
  let value = req.body.value;
  let type = req.body.type;
  let typeid = req.body.typeid;

  if (!value || !type || !typeid)
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  let game = "";
  let bs = "";
  if (typeid == "1") {
    game = "wingo1";
    bs = "bs1";
  }
  if (typeid == "2") {
    game = "wingo3";
    bs = "bs3";
  }
  if (typeid == "3") {
    game = "wingo5";
    bs = "bs5";
  }
  if (typeid == "4") {
    game = "wingo10";
    bs = "bs10";
  }
  switch (type) {
    case "change-wingo1":
      await connection.query(`UPDATE admin_ac SET ${game} = ? `, [value]);
      return res.status(200).json({
        message: "Editing results successfully",
        status: true,
        timeStamp: timeNow,
      });
      break;
    case "change-win_rate":
      await connection.query(`UPDATE admin_ac SET ${bs} = ? `, [value]);
      return res.status(200).json({
        message: "Editing win rate successfully",
        status: true,
        timeStamp: timeNow,
      });
      break;

    default:
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: timeNow,
      });
      break;
  }
};

function formateT(params) {
  let result = params < 10 ? "0" + params : params;
  return result;
}

function timerJoin(params = "", addHours = 0) {
  let date = "";
  if (params) {
    date = new Date(Number(params));
  } else {
    date = new Date();
  }

  date.setHours(date.getHours() + addHours);

  let years = formateT(date.getFullYear());
  let months = formateT(date.getMonth() + 1);
  let days = formateT(date.getDate());

  let hours = date.getHours() % 12;
  hours = hours === 0 ? 12 : hours;
  let ampm = date.getHours() < 12 ? "AM" : "PM";

  let minutes = formateT(date.getMinutes());
  let seconds = formateT(date.getSeconds());

  return (
    years +
    "-" +
    months +
    "-" +
    days +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds +
    " " +
    ampm
  );
}

const userInfo = async (req, res) => {
  let auth = req.cookies.auth;
  let phone = req.body.phone;
  if (!phone) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );

  if (user.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let userInfo = user[0];
  // direct subordinate all
  const [f1s] = await connection.query(
    "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
    [userInfo.code],
  );

  // cấp dưới trực tiếp hôm nay
  let f1_today = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_time = f1s[i].time; // Mã giới thiệu f1
    let check = timerJoin(f1_time) == timerJoin() ? true : false;
    if (check) {
      f1_today += 1;
    }
  }

  // tất cả cấp dưới hôm nay
  let f_all_today = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const f1_time = f1s[i].time; // time f1
    let check_f1 = timerJoin(f1_time) == timerJoin() ? true : false;
    if (check_f1) f_all_today += 1;
    // tổng f1 mời đc hôm nay
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code; // Mã giới thiệu f2
      const f2_time = f2s[i].time; // time f2
      let check_f2 = timerJoin(f2_time) == timerJoin() ? true : false;
      if (check_f2) f_all_today += 1;
      // tổng f2 mời đc hôm nay
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code; // Mã giới thiệu f3
        const f3_time = f3s[i].time; // time f3
        let check_f3 = timerJoin(f3_time) == timerJoin() ? true : false;
        if (check_f3) f_all_today += 1;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        // tổng f3 mời đc hôm nay
        for (let i = 0; i < f4s.length; i++) {
          const f4_code = f4s[i].code; // Mã giới thiệu f4
          const f4_time = f4s[i].time; // time f4
          let check_f4 = timerJoin(f4_time) == timerJoin() ? true : false;
          if (check_f4) f_all_today += 1;
          // tổng f3 mời đc hôm nay
        }
      }
    }
  }

  // Tổng số f2
  let f2 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    f2 += f2s.length;
  }

  // Tổng số f3
  let f3 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      if (f3s.length > 0) f3 += f3s.length;
    }
  }

  // Tổng số f4
  let f4 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        if (f4s.length > 0) f4 += f4s.length;
      }
    }
  }
  // console.log("TOTAL_F_TODAY:" + f_all_today);
  // console.log("F1: " + f1s.length);
  // console.log("F2: " + f2);
  // console.log("F3: " + f3);
  // console.log("F4: " + f4);

  const [recharge] = await connection.query(
    "SELECT SUM(`money`) as total FROM recharge WHERE phone = ? AND status = 1 ",
    [phone],
  );
  const [withdraw] = await connection.query(
    "SELECT SUM(`money`) as total FROM withdraw WHERE phone = ? AND status = 1 ",
    [phone],
  );
  const [bank_user] = await connection.query(
    "SELECT * FROM user_bank WHERE phone = ? ",
    [phone],
  );
  const [telegram_ctv] = await connection.query(
    "SELECT `telegram` FROM point_list WHERE phone = ? ",
    [userInfo.ctv],
  );
  const [ng_moi] = await connection.query(
    "SELECT `phone` FROM users WHERE code = ? ",
    [userInfo.invite],
  );
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: user,
    total_r: recharge,
    total_w: withdraw,
    f1: f1s.length,
    f2: f2,
    f3: f3,
    f4: f4,
    bank_user: bank_user,
    telegram: telegram_ctv[0],
    ng_moi: ng_moi[0],
    daily: userInfo.ctv,
  });
};

const recharge = async (req, res) => {
  let auth = req.cookies.auth;
  const date = req.body.date;
  if (!auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [recharge] = await connection.query(
    "SELECT * FROM recharge WHERE status = 0 ",
  );
  const [recharge2] = await connection.query(
    "SELECT * FROM recharge WHERE status != 0 AND DATE(bet_data)=?", [date]
  );
  const [withdraw] = await connection.query(
    "SELECT * FROM withdraw WHERE status = 0 ",
  );
  const [withdraw2] = await connection.query(
    "SELECT * FROM withdraw WHERE status != 0 AND DATE(today)=?", [date]
  );
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: recharge,
    datas2: recharge2,
    datas3: withdraw,
    datas4: withdraw2,
  });
};

const settingGet = async (req, res) => {
  try {
    let auth = req.cookies.auth;
    if (!auth) {
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: timeNow,
      });
    }

    const [bank_recharge] = await connection.query(
      "SELECT * FROM bank_recharge",
    );
    const [bank_recharge_momo] = await connection.query(
      "SELECT * FROM bank_recharge WHERE type = 'momo'",
    );
    const [settings] = await connection.query("SELECT * FROM admin_ac ");

    let bank_recharge_momo_data;
    if (bank_recharge_momo.length) {
      bank_recharge_momo_data = bank_recharge_momo[0];
    }
    return res.status(200).json({
      message: "Success",
      status: true,
      settings: settings,
      datas: bank_recharge,
      momo: {
        bank_name: bank_recharge_momo_data?.name_bank || "",
        username: bank_recharge_momo_data?.name_user || "",
        upi_id: bank_recharge_momo_data?.stk || "",
        usdt_wallet_address: bank_recharge_momo_data?.qr_code_image || "",
        account: bank_recharge_momo_data?.account_no || "",
        ifsc: bank_recharge_momo_data?.ifsc || "",
        qr_code: bank_recharge_momo_data?.qr_code || "",
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed",
      status: false,
    });
  }
};

const rechargeDuyet = async (req, res) => {
  let auth = req.cookies.auth;
  let id = req.body.id;
  let type = req.body.type;
  if (!auth || !id || !type) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  if (type == "confirm") {
    const [info] = await connection.query(
      `SELECT * FROM recharge WHERE id = ?`,
      [id],
    );
    const user = await getUserDataByPhone(info?.[0]?.phone);

    addUserAccountBalance({
      money: info[0].money,
      phone: user.phone,
      invite: user.invite,
      rechargeId: id,
    });

    return res.status(200).json({
      message: "Successful application confirmation",
      status: true,
      datas: recharge,
    });
  }
  if (type == "delete") {
    await connection.query(`UPDATE recharge SET status = 2 WHERE id = ?`, [id]);

    return res.status(200).json({
      message: "Cancellation successful",
      status: true,
      datas: recharge,
    });
  }
};

const getUserDataByPhone = async (phone) => {
  let [users] = await connection.query(
    "SELECT `phone`, `code`,`name_user`,`invite` FROM users WHERE `phone` = ? ",
    [phone],
  );
  const user = users?.[0];

  if (user === undefined || user === null) {
    throw Error("Unable to get user data!");
  }

  return {
    phone: user.phone,
    code: user.code,
    username: user.name_user,
    invite: user.invite,
  };
};
const setRechargeStatus = async (status, rechargeId) => {
  let timeNow = Date.now();
  await connection.query(
    `UPDATE recharge SET status = ?, time = ? WHERE id = ?`,
    [status, timeNow, rechargeId],
  );
};

const totalRechargeCount = async (status, phone) => {
  const [totalRechargeCount] = await connection.query(
    "SELECT COUNT(*) as count FROM recharge WHERE phone = ? AND status = ?",
    [phone, status],
  );
  const totalRecharge = totalRechargeCount[0].count || 0;
  return totalRecharge;
};

const updateUserMoney = async (phone, money) => {
  // update user money
  await connection.query(
    "UPDATE users SET money = money + ?, total_money = total_money + ?,needbet=needbet+? WHERE `phone` = ?",
    [money, money,money, phone],
  );
};

const updateRemainingBet = async (phone, money, rechargeId, totalRecharge) => {
  const [previousRecharge] = await connection.query(
    `SELECT remaining_bet FROM recharge WHERE phone = ? AND status = 1 ORDER BY time DESC LIMIT 2`,
    [phone],
  );
  const totalRemainingBet =
    totalRecharge === 1 ? money : previousRecharge[1].remaining_bet + money;

  await connection.query("UPDATE recharge SET remaining_bet = ? WHERE id = ?", [
    totalRemainingBet,
    rechargeId,
  ]);
};

const addRewards = async (phone, bonus, rewardType) => {
  const reward_id = generateClaimRewardID();
  let timeNow = Date.now();

  await connection.query(
    "INSERT INTO claimed_rewards (reward_id, phone, amount, status, type, time) VALUES (?, ?, ?, ?, ?, ?)",
    [reward_id, phone, bonus, 1, rewardType, timeNow],
  );
};

const getUserByInviteCode = async (invite) => {
  const [inviter] = await connection.query(
    "SELECT phone FROM users WHERE `code` = ?",
    [invite],
  );
  return inviter?.[0] || null;
};

const addUserAccountBalance = async ({ money, phone, invite, rechargeId }) => {
  let timeNow = Date.now();

  await setRechargeStatus(REWARD_STATUS_TYPES_MAP.SUCCESS, rechargeId);

  const totalRecharge = await totalRechargeCount(
    REWARD_STATUS_TYPES_MAP.SUCCESS,
    phone,
  );

  const bonus = (money / 100) * 5;
  const user_money = money + bonus;
  const inviter_money =
    totalRecharge === 1 ? getBonuses(money).uplineBonus + bonus : bonus;

  await updateUserMoney(phone, user_money);

  await updateRemainingBet(phone, money, rechargeId, totalRecharge);

  const rewardType = REWARD_TYPES_MAP.DAILY_RECHARGE_BONUS;
  await addRewards(phone, bonus, rewardType);

  const inviter = await getUserByInviteCode(invite);

  if (inviter) {
    const rewardType =
      totalRecharge === 1
        ? REWARD_TYPES_MAP.FIRST_RECHARGE_AGENT_BONUS
        : REWARD_TYPES_MAP.DAILY_RECHARGE_AGENT_BONUS;
    await addRewards(inviter.phone, inviter_money, rewardType);
    await updateUserMoney(inviter.phone, inviter_money, inviter.phone);
  }
};

const updateLevel = async (req, res) => {
  try {
    let id = req.body.id;
    let f1 = req.body.f1;
    let f2 = req.body.f2;
    let f3 = req.body.f3;
    let f4 = req.body.f4;

    console.log("level : " + id, f1, f2, f3, f4);

    await connection.query(
      "UPDATE `level` SET `f1`= ? ,`f2`= ? ,`f3`= ? ,`f4`= ?  WHERE `id` = ?",
      [f1, f2, f3, f4, id],
    );

    // Send a success response to the client
    res.status(200).json({
      message: "Update successful",
      status: true,
    });
  } catch (error) {
    console.error("Error updating level:", error);

    // Send an error response to the client
    res.status(500).json({
      message: "Update failed",
      status: false,
      error: error.message,
    });
  }
};

const handlWithdraw = async (req, res) => {
  let auth = req.cookies.auth;
  let id = req.body.id;
  let type = req.body.type;
  if (!auth || !id || !type) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  if (type == "confirm") {
    await connection.query(`UPDATE withdraw SET status = 1 WHERE id = ?`, [id]);
    const [info] = await connection.query(
      `SELECT * FROM withdraw WHERE id = ?`,
      [id],
    );
    return res.status(200).json({
      message: "Successful application confirmation",
      status: true,
      datas: recharge,
    });
  }
  if (type == "delete") {
    await connection.query(`UPDATE withdraw SET status = 2 WHERE id = ?`, [id]);
    const [info] = await connection.query(
      `SELECT * FROM withdraw WHERE id = ?`,
      [id],
    );
    await connection.query(
      "UPDATE users SET money = money + ? WHERE phone = ? ",
      [info[0].money, info[0].phone],
    );
    return res.status(200).json({
      message: "Cancel successfully",
      status: true,
      datas: recharge,
    });
  }
};

// const settingBank = async (req, res) => {
//   try {
//     let auth = req.cookies.auth;
//     const {
//       bank_name,
//       username,
//       upi_id,
//       qr,
//       account,
//       ifsc,
//       typer,
//       qr_code_image
//     } = req.body;

//     console.log(req.body)




//     if (!auth || !typer) {
//       return res.status(200).json({
//         message: "Failed auth",
//         status: false,
//         timeStamp: timeNow,
//       });
//     }


//     if (typer == "momo") {
//       await connection.query(
//         `UPDATE bank_recharge 
//          SET name_bank = ?, name_user = ?, stk = ?, account_no = ?, ifsc = ? , qr_code_image = ?
//          WHERE type = 'momo'`,
//         [bank_name, username, upi_id, account, ifsc, qr_code_image]
//       );
//       return res.status(200).json({
//         message: "Successful change update",
//         status: true,
//         datas: recharge,
//       });
//     }

//     if (typer == "bank") {
//       const [bank_recharge] = await connection.query(
//         `SELECT * FROM bank_recharge WHERE type = 'momo'`,
//       );

//       const deleteRechargeQueries = bank_recharge.map((recharge) => {
//         return deleteBankRechargeById(recharge.id);
//       });

//       await Promise.all(deleteRechargeQueries);

//       // await connection.query(`UPDATE bank_recharge SET name_bank = ?, name_user = ?, stk = ?, qr_code_image = ? WHERE type = 'upi'`, [name_bank, name, info, qr]);

//       const bankName = req.body.bank_name;
//       const username = req.body.username;
//       const upiId = req.body.upi_id;
//       const usdtWalletAddress = req.body.usdt_wallet_address;
//       const qr_code = req.files?.qr_code_image ? `/uploads/${req.files.qr_code_image[0].filename}` : null;

//       console.log(qr_code)

//       await connection.query(
//         "INSERT INTO bank_recharge SET name_bank = ?, name_user = ?, stk = ?, qr_code_image = ?, qr_code = ?, type = 'momo'",
//         [bankName, username, upiId, usdtWalletAddress, qr_code],
//       );

//       return res.status(200).json({
//         message: "Successfully changed",
//         status: true,
//         datas: recharge,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: "Something went wrong!",
//       status: false,
//       error: error.message
//     });
//   }
// };

const settingBank = async (req, res) => {
  try {


      let auth = req.cookies.auth;
      let name_bank = req.body.name_bank;
      let name = req.body.name;
      let info = req.body.info;
      let qr = req.body.qr;
      let typer = req.body.typer;

      if (!auth || !typer) {
          return res.status(200).json({
              message: 'Failed',
              status: false,
              timeStamp: timeNow,
          });
      }
      if (typer == 'bank') {
          await connection.query(`UPDATE bank_recharge SET name_bank = ?, name_user = ?, stk = ? WHERE type = 'bank'`, [name_bank, name, info]);
          return res.status(200).json({
              message: 'Successful change',
              status: true,
              datas: recharge,
          });
      }

      if (typer == 'momo') {
          const [bank_recharge] = await connection.query(`SELECT * FROM bank_recharge WHERE type = 'momo'`);

          const deleteRechargeQueries = bank_recharge.map(recharge => {
              return deleteBankRechargeById(recharge.id)
          });

          await Promise.all(deleteRechargeQueries)

          // await connection.query(`UPDATE bank_recharge SET name_bank = ?, name_user = ?, stk = ?, qr_code_image = ? WHERE type = 'upi'`, [name_bank, name, info, qr]);

          const bankName = req.body.bank_name
          const username = req.body.username
          const upiId = req.body.upi_id
          const usdtWalletAddress = req.body.usdt_wallet_address || "";
          const qr_code = req.files?.qr_code_image ? `/uploads/${req.files.qr_code_image[0].filename}` : bank_recharge[0] ? bank_recharge[0].qr_code : null

          // console.log(qr_code_image)

          await connection.query("INSERT INTO bank_recharge SET name_bank = ?, name_user = ?, stk = ?, qr_code_image = ?, qr_code = ?, type = 'momo'", [
              bankName, username, upiId, usdtWalletAddress, qr_code
          ])

          return res.status(200).json({
              message: 'Successfully changed',
              status: true,
              datas: recharge,
          });
      }
  } catch (error) {
      console.log(error)
      return res.status(500).json({
          message: 'Something went wrong!',
          status: false,
      });
  }
}

const deleteBankRechargeById = async (id) => {
  const [recharge] = await connection.query(
    "DELETE FROM bank_recharge WHERE type = 'momo' AND id = ?",
    [id],
  );

  return recharge;
};

const settingCskh = async (req, res) => {
  let auth = req.cookies.auth;
  let telegram = req.body.telegram;
  let cskh = req.body.cskh;
  let myapp_web = req.body.myapp_web;
  if (!auth || !cskh || !telegram) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  await connection.query(
    `UPDATE admin_ac SET telegram = ?, cskh = ?, app = ?`,
    [telegram, cskh, myapp_web],
  );
  return res.status(200).json({
    message: "Successful change",
    status: true,
  });
};

const banned = async (req, res) => {
  let auth = req.cookies.auth;
  let id = req.body.id;
  let type = req.body.type;
  if (!auth || !id) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  if (type == "open") {
    await connection.query(`UPDATE users SET status = 1 WHERE id = ?`, [id]);
  }
  if (type == "close") {
    await connection.query(`UPDATE users SET status = 2 WHERE id = ?`, [id]);
  }
  return res.status(200).json({
    message: "Successful change",
    status: true,
  });
};

const generateGiftCode = (length) => {
  var result = "";
  var characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const createBonus = async (req, res) => {
  const time = new Date().getTime();

  let auth = req.cookies.auth;
  let money = req.body.money;
  let type = req.body.type;
  let numberOfUsers = req.body?.numberOfUsers;
  let isForNewUsers = req.body?.isForNewUsers;
  let expireDate = req.body?.expireDate;

  if (!money || !auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [user] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let userInfo = user[0];

  if (type == "all") {
    let select = req.body.select;
    if (select == "1") {
      await connection.query(
        `UPDATE point_list SET money = money + ? WHERE level = 2`,
        [money],
      );
    } else {
      await connection.query(
        `UPDATE point_list SET money = money - ? WHERE level = 2`,
        [money],
      );
    }
    return res.status(200).json({
      message: "successful change",
      status: true,
    });
  }

  if (type == "two") {
    let select = req.body.select;
    if (select == "1") {
      await connection.query(
        `UPDATE point_list SET money_us = money_us + ? WHERE level = 2`,
        [money],
      );
    } else {
      await connection.query(
        `UPDATE point_list SET money_us = money_us - ? WHERE level = 2`,
        [money],
      );
    }
    return res.status(200).json({
      message: "successful change",
      status: true,
    });
  }

  if (type == "one") {
    let select = req.body.select;
    let phone = req.body.phone;
    const [user] = await connection.query(
      "SELECT * FROM point_list WHERE phone = ? ",
      [phone],
    );
    if (user.length == 0) {
      return res.status(200).json({
        message: "Failed",
        status: false,
        timeStamp: timeNow,
      });
    }
    if (select == "1") {
      await connection.query(
        `UPDATE point_list SET money = money + ? WHERE level = 2 and phone = ?`,
        [money, phone],
      );
    } else {
      await connection.query(
        `UPDATE point_list SET money = money - ? WHERE level = 2 and phone = ?`,
        [money, phone],
      );
    }
    return res.status(200).json({
      message: "successful change",
      status: true,
    });
  }

  if (type == "three") {
    let select = req.body.select;
    let phone = req.body.phone;
    const [user] = await connection.query(
      "SELECT * FROM point_list WHERE phone = ? ",
      [phone],
    );
    if (user.length == 0) {
      return res.status(200).json({
        message: "account does not exist",
        status: false,
        timeStamp: timeNow,
      });
    }
    if (select == "1") {
      await connection.query(
        `UPDATE users SET money = money + ? WHERE  phone = ?`,
        [money, phone],
      );
    } else {
      await connection.query(
        `UPDATE users SET money = money - ? WHERE phone = ?`,
        [money, phone],
      );
    }
    return res.status(200).json({
      message: "successful change",
      status: true,
    });
  }

  if (!type) {
    const expireDateInMilliseconds = moment(
      expireDate,
      "DD/MM/YYYY HH:mm:ss",
    ).valueOf();

    const currentTime = moment().valueOf();

    if (expireDate != 0 && expireDateInMilliseconds <= currentTime) {
      return res.status(400).json({
        message: "The expiration date must be in the future relative to the current date.",
        status: false,
      });
    }

    let GiftCode = generateGiftCode(16);

    if (expireDate) {
      let sql = `INSERT INTO redenvelopes SET id_redenvelope = ?, phone = ?, money = ?, used = ?, amount = ?, status = ?, for_new_users = ?, time = ?, expire_date = ?`;
      await connection.query(sql, [
        GiftCode,
        userInfo.phone,
        money,
        numberOfUsers,
        1,
        0,
        isForNewUsers,
        time,
        expireDateInMilliseconds,
      ]);
    } else {
      let sql = `INSERT INTO redenvelopes SET id_redenvelope = ?, phone = ?, money = ?, used = ?, amount = ?, status = ?, for_new_users = ?, time = ?`;
      await connection.query(sql, [
        GiftCode,
        userInfo.phone,
        money,
        numberOfUsers,
        1,
        0,
        isForNewUsers,
        time,
      ]);
    }

    return res.status(200).json({
      message: "Successful change",
      status: true,
      id: GiftCode,
    });
  }
};

const listRedenvelops = async (req, res) => {
  let auth = req.cookies.auth;

  let [redenvelopes] = await connection.query(
    "SELECT * FROM redenvelopes WHERE status = 0 ORDER BY time DESC",
  );

  return res.status(200).json({
    message: "Successful change",
    status: true,
    redenvelopes: redenvelopes,
  });
};

const settingbuff = async (req, res) => {
  let auth = req.cookies.auth;
  let id_user = req.body.id_user;
  let buff_acc = req.body.buff_acc;
  let money_value = req.body.money_value;
  if (!id_user || !buff_acc || !money_value) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [user_id] = await connection.query(
    `SELECT * FROM users WHERE id_user = ?`,
    [id_user],
  );

  if (user_id.length > 0) {
    if (buff_acc == "1") {
      await connection.query(
        `UPDATE users SET money = money + ? WHERE id_user = ?`,
        [money_value, id_user],
      );
    }
    if (buff_acc == "2") {
      await connection.query(
        `UPDATE users SET money = money - ? WHERE id_user = ?`,
        [money_value, id_user],
      );
    }
    return res.status(200).json({
      message: "Successful change",
      status: true,
    });
  } else {
    return res.status(200).json({
      message: "Successful change",
      status: false,
    });
  }
};
const randomNumber = (min, max) => {
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

const randomString = (length) => {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const ipAddress = (req) => {
  let ip = "";
  if (req.headers["x-forwarded-for"]) {
    ip = req.headers["x-forwarded-for"].split(",")[0];
  } else if (req.connection && req.connection.remoteAddress) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.ip;
  }
  return ip;
};

const timeCreate = () => {
  const d = new Date();
  const time = d.getTime();
  return time;
};

const register = async (req, res) => {
  let { username, password, invitecode } = req.body;
  let id_user = randomNumber(10000, 99999);
  let name_user = "Member" + randomNumber(10000, 99999);
  let code = randomString(5) + randomNumber(10000, 99999);
  let ip = ipAddress(req);
  let time = timeCreate();

  invitecode = "2cOCs36373";

  if (!username || !password || !invitecode) {
    return res.status(200).json({
      message: "ERROR!!!",
      status: false,
    });
  }

  if (!username) {
    return res.status(200).json({
      message: "phone error",
      status: false,
    });
  }
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  try {
    const [check_u] = await connection.query(
      "SELECT * FROM users WHERE phone = ? ",
      [username],
    );
    if (check_u.length == 1) {
      return res.status(200).json({
        message: "register account", //Số điện thoại đã được đăng ký
        status: false,
      });
    } else {
      const sql = `INSERT INTO users SET 
            id_user = ?,
            phone = ?,
            name_user = ?,
            password = ?,
            plain_password = ?,
            money = ?,
            level = ?,
            code = ?,
            invite = ?,
            veri = ?,
            ip_address = ?,
            status = ?,
            time = ?`;
      await connection.execute(sql, [
        id_user,
        username,
        name_user,
        hashedPassword,
        password,
        0,
        2,
        code,
        invitecode,
        1,
        ip,
        1,
        time,
      ]);
      await connection.execute(
        "INSERT INTO point_list SET phone = ?, level = 2",
        [username],
      );
      return res.status(200).json({
        message: "registration success", //Register Sucess
        status: true,
      });
    }
  } catch (error) {
    if (error) console.log(error);
  }
};

const profileUser = async (req, res) => {
  let phone = req.body.phone;
  if (!phone) {
    return res.status(200).json({
      message: "Phone Error",
      status: false,
      timeStamp: timeNow,
    });
  }
  let [user] = await connection.query(`SELECT * FROM users WHERE phone = ?`, [
    phone,
  ]);

  if (user.length == 0) {
    return res.status(200).json({
      message: "Phone Error",
      status: false,
      timeStamp: timeNow,
    });
  }
  let [recharge] = await connection.query(
    `SELECT * FROM recharge WHERE phone = ? ORDER BY id DESC LIMIT 10`,
    [phone],
  );
  let [withdraw] = await connection.query(
    `SELECT * FROM withdraw WHERE phone = ? ORDER BY id DESC LIMIT 10`,
    [phone],
  );
  return res.status(200).json({
    message: "Get success",
    status: true,
    recharge: recharge,
    withdraw: withdraw,
  });
};






function timerJoins(params = "", addHours = 0) {
  let date = "";
  if (params) {
    date = new Date(Number(params));
  } else {
    date = new Date();
  }

  date.setHours(date.getHours() + addHours);

  let years = formateT(date.getFullYear());
  let months = formateT(date.getMonth() + 1);
  let days = formateT(date.getDate());

  let hours = date.getHours() % 12;
  hours = hours === 0 ? 12 : hours;
  let ampm = date.getHours() < 12 ? "AM" : "PM";

  let minutes = formateT(date.getMinutes());
  let seconds = formateT(date.getSeconds());

  return (
    years +
    "-" +
    months +
    "-" +
    days
  );
}

function timerJoinss(params = "", addHours = 0) {
  let date = "";
  if (params) {
    date = new Date(Number(params));
  } else {
    date = new Date();
  }

  date.setHours(date.getHours() + addHours);

  let years = formateT(date.getFullYear());
  let months = formateT(date.getMonth() + 1);
  let days = formateT(date.getDate());


  return (
    years +
    "-" +
    days +

    "-" +
    months
  );
}


// collabrotor
const infoCtv = async (req, res) => {
  const phone = req.body.phone;

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );

  if (user.length == 0) {
    return res.status(200).json({
      message: "Phone Error",
      status: false,
    });
  }
  let userInfo = user[0];
  // cấp dưới trực tiếp all
  const [f1s] = await connection.query(
    "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
    [userInfo.code],
  );

  // cấp dưới trực tiếp hôm nay
  let f1_today = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_time = f1s[i].time; // Mã giới thiệu f1
    let check = timerJoins(f1_time) == timerJoins() ? true : false;
    if (check) {
      f1_today += 1;
    }
  }

  // tất cả cấp dưới hôm nay
  let f_all_today = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const f1_time = f1s[i].today; // time f1
    let check_f1 = timerJoins(f1_time) == timerJoins() ? true : false;
    if (check_f1) f_all_today += 1;
    // tổng f1 mời đc hôm nay
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code; // Mã giới thiệu f2
      const f2_time = f2s[i].time; // time f2
      let check_f2 = timerJoins(f2_time) == timerJoins() ? true : false;
      if (check_f2) f_all_today += 1;
      // tổng f2 mời đc hôm nay
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code; // Mã giới thiệu f3
        const f3_time = f3s[i].time; // time f3
        let check_f3 = timerJoins(f3_time) == timerJoins() ? true : false;
        if (check_f3) f_all_today += 1;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        // tổng f3 mời đc hôm nay
        for (let i = 0; i < f4s.length; i++) {
          const f4_code = f4s[i].code; // Mã giới thiệu f4
          const f4_time = f4s[i].today; // time f4
          let check_f4 = timerJoins(f4_time) == timerJoins() ? true : false;
          if (check_f4) f_all_today += 1;
          // tổng f3 mời đc hôm nay
        }
      }
    }
  }

  // Tổng số f2
  let f2 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    f2 += f2s.length;
  }

  // Tổng số f3
  let f3 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      if (f3s.length > 0) f3 += f3s.length;
    }
  }

  // Tổng số f4
  let f4 = 0;
  for (let i = 0; i < f1s.length; i++) {
    const f1_code = f1s[i].code; // Mã giới thiệu f1
    const [f2s] = await connection.query(
      "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
      [f1_code],
    );
    for (let i = 0; i < f2s.length; i++) {
      const f2_code = f2s[i].code;
      const [f3s] = await connection.query(
        "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
        [f2_code],
      );
      for (let i = 0; i < f3s.length; i++) {
        const f3_code = f3s[i].code;
        const [f4s] = await connection.query(
          "SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ",
          [f3_code],
        );
        if (f4s.length > 0) f4 += f4s.length;
      }
    }
  }

  const [list_mem] = await connection.query(
    "SELECT * FROM users WHERE invite = ? AND status = 1 AND veri = 1 ",
    [userInfo.code],
  );
  const [list_mem_baned] = await connection.query(
    "SELECT * FROM users WHERE invite = ? AND status = 2 AND veri = 1 ",
    [userInfo.code],
  );
  let total_recharge = 0;
  let total_withdraw = 0;
  for (let i = 0; i < list_mem.length; i++) {
    let phone = list_mem[i].phone;
    const [recharge] = await connection.query(
      "SELECT SUM(money) as money FROM recharge WHERE phone = ? AND status = 1 ",
      [phone],
    );
    const [withdraw] = await connection.query(
      "SELECT SUM(money) as money FROM withdraw WHERE phone = ? AND status = 1 ",
      [phone],
    );
    if (recharge[0].money) {
      total_recharge += Number(recharge[0].money);
    }
    if (withdraw[0].money) {
      total_withdraw += Number(withdraw[0].money);
    }
  }

  let total_recharge_today = 0;
  let total_withdraw_today = 0;
  for (let i = 0; i < list_mem.length; i++) {
    let phone = list_mem[i].phone;
    const [recharge_today] = await connection.query(
      "SELECT `money`, `time` FROM recharge WHERE phone = ? AND status = 1 ",
      [phone],
    );
    const [withdraw_today] = await connection.query(
      "SELECT `money`, `time` FROM withdraw WHERE phone = ? AND status = 1 ",
      [phone],
    );
    for (let i = 0; i < recharge_today.length; i++) {
      let today = timerJoins();
      let time = timerJoins(recharge_today[i].time);
      if (time == today) {
        total_recharge_today += recharge_today[i].money;
      }
    }
    for (let i = 0; i < withdraw_today.length; i++) {
      let today = timerJoins();
      let time = timerJoins(withdraw_today[i].time);
      if (time == today) {
        total_withdraw_today += withdraw_today[i].money;
      }
    }
  }

  let win = 0;
  let loss = 0;
  for (let i = 0; i < list_mem.length; i++) {
    let phone = list_mem[i].phone;
    const [wins] = await connection.query(
      "SELECT `money`, `time` FROM minutes_1 WHERE phone = ? AND status = 1 ",
      [phone],
    );
    const [losses] = await connection.query(
      "SELECT `money`, `time` FROM minutes_1 WHERE phone = ? AND status = 2 ",
      [phone],
    );

    for (let i = 0; i < wins.length; i++) {
      let today = timerJoins();
      let time = timerJoins(wins[i].today);
      if (time == today) {
        win += wins[i].money;
      }
    }
    for (let i = 0; i < losses.length; i++) {
      let today = timerJoins();
      let time = timerJoins(losses[i].today);
      if (time == today) {
        loss += losses[i].money;
      }
    }
  }
  let list_mems = [];
  const [list_mem_today] = await connection.query(
    "SELECT * FROM users WHERE invite = ? AND status = 1 AND veri = 1 ",
    [userInfo.code],
  );



  for (let i = 0; i < list_mem_today.length; i++) {
    let today = timerJoins();
    let time = timerJoins(list_mem_today[i].today);
    if (time == today) {
      list_mems.push(list_mem_today[i]);
    }
  }

  const [point_list] = await connection.query(
    "SELECT * FROM point_list WHERE phone = ? ",
    [phone],
  );

  let moneyCTV = point_list[0]?.money;

  let list_recharge_news = [];
  let list_withdraw_news = [];
  for (let i = 0; i < list_mem.length; i++) {
    let phone = list_mem[i].phone;
    const [recharge_today] = await connection.query(
      "SELECT `id`, `status`, `type`,`phone`, `money`, `time` FROM recharge WHERE phone = ? AND status = 1 ",
      [phone],
    );
    const [withdraw_today] = await connection.query(
      "SELECT `id`, `status`,`phone`, `money`, `time` FROM withdraw WHERE phone = ? AND status = 1 ",
      [phone],
    );
    for (let i = 0; i < recharge_today.length; i++) {
      let today = timerJoins();
      let time = timerJoins(recharge_today[i].time);
      if (time == today) {
        list_recharge_news.push(recharge_today[i]);
      }
    }
    for (let i = 0; i < withdraw_today.length; i++) {
      let today = timerJoins();
      let time = timerJoins(withdraw_today[i].time);
      if (time == today) {
        list_withdraw_news.push(withdraw_today[i]);
      }
    }
  }

  const [redenvelopes_used] = await connection.query(
    "SELECT * FROM redenvelopes_used WHERE phone = ? ",
    [phone],
  );
  let redenvelopes_used_today = [];
  for (let i = 0; i < redenvelopes_used.length; i++) {
    let today = timerJoins();
    let time = timerJoins(redenvelopes_used[i].time);
    if (time == today) {
      redenvelopes_used_today.push(redenvelopes_used[i]);
    }
  }

  const [financial_details] = await connection.query(
    "SELECT * FROM financial_details WHERE phone = ? ",
    [phone],
  );
  let financial_details_today = [];
  for (let i = 0; i < financial_details.length; i++) {
    let today = timerJoins();
    let time = timerJoins(financial_details[i].time);
    if (time == today) {
      financial_details_today.push(financial_details[i]);
    }
  }

  return res.status(200).json({
    message: "Success",
    status: true,
    datas: list_mems,
    //  datas: user,
    f1: f1s.length,
    f2: f2,
    f3: f3,
    f4: f4,
    list_mems: list_mems,
    total_recharge: total_recharge,
    total_withdraw: total_withdraw,
    total_recharge_today: total_recharge_today,
    total_withdraw_today: total_withdraw_today,
    list_mem_baned: list_mem_baned.length,
    win: win,
    loss: loss,
    list_recharge_news: list_recharge_news,
    list_withdraw_news: list_withdraw_news,
    moneyCTV: moneyCTV,
    redenvelopes_used: redenvelopes_used_today,
    financial_details_today: financial_details_today,
  });
};




const infoCtv2 = async (req, res) => {
  const phone = req.body.phone;
  const timeDate = req.body.timeDate;

  function timerJoin(params = "", addHours = 0) {
    let date = "";
    if (params) {
      date = new Date(Number(params));
    } else {
      date = new Date();
    }

    date.setHours(date.getHours() + addHours);

    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());

    let hours = date.getHours() % 12;
    hours = hours === 0 ? 12 : hours;
    let ampm = date.getHours() < 12 ? "AM" : "PM";

    let minutes = formateT(date.getMinutes());
    let seconds = formateT(date.getSeconds());

    return (
      years +
      "-" +
      months +
      "-" +
      days
    );
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );

  if (user.length == 0) {
    return res.status(200).json({
      message: "Phone Error",
      status: false,
    });
  }
  let userInfo = user[0];
  const [list_mem] = await connection.query(
    "SELECT * FROM users WHERE ctv = ? AND status = 1 AND veri = 1 ",
    [phone],
  );

  let list_mems = [];
  const [list_mem_today] = await connection.query(
    "SELECT * FROM users WHERE ctv = ? AND status = 1 AND veri = 1 ",
    [phone],
  );
  for (let i = 0; i < list_mem_today.length; i++) {
    let today = timeDate;
    let time = timerJoin(list_mem_today[i].time);
    if (time == today) {
      list_mems.push(list_mem_today[i]);
    }
  }

  let list_recharge_news = [];
  let list_withdraw_news = [];
  for (let i = 0; i < list_mem.length; i++) {
    let phone = list_mem[i].phone;
    const [recharge_today] = await connection.query(
      "SELECT `id`, `status`, `type`,`phone`, `money`, `time` FROM recharge WHERE phone = ? AND status = 1 ",
      [phone],
    );
    const [withdraw_today] = await connection.query(
      "SELECT `id`, `status`,`phone`, `money`, `time` FROM withdraw WHERE phone = ? AND status = 1 ",
      [phone],
    );
    for (let i = 0; i < recharge_today.length; i++) {
      let today = timeDate;
      let time = timerJoin(recharge_today[i].time);
      if (time == today) {
        list_recharge_news.push(recharge_today[i]);
      }
    }
    for (let i = 0; i < withdraw_today.length; i++) {
      let today = timeDate;
      let time = timerJoin(withdraw_today[i].time);
      if (time == today) {
        list_withdraw_news.push(withdraw_today[i]);
      }
    }
  }

  const [redenvelopes_used] = await connection.query(
    "SELECT * FROM redenvelopes_used WHERE phone = ? ",
    [phone],
  );
  let redenvelopes_used_today = [];
  for (let i = 0; i < redenvelopes_used.length; i++) {
    let today = timeDate;
    let time = timerJoin(redenvelopes_used[i].time);
    if (time == today) {
      redenvelopes_used_today.push(redenvelopes_used[i]);
    }
  }

  const [financial_details] = await connection.query(
    "SELECT * FROM financial_details WHERE phone = ? ",
    [phone],
  );
  let financial_details_today = [];
  for (let i = 0; i < financial_details.length; i++) {
    let today = timeDate;
    let time = timerJoin(financial_details[i].time);
    if (time == today) {
      financial_details_today.push(financial_details[i]);
    }
  }

  return res.status(200).json({
    message: "Success",
    status: true,
    datas: user,
    list_mems: list_mems,
    list_recharge_news: list_recharge_news,
    list_withdraw_news: list_withdraw_news,
    redenvelopes_used: redenvelopes_used_today,
    financial_details_today: financial_details_today,
  });
};

const listRechargeMem = async (req, res) => {
  let auth = req.cookies.auth;
  let phone = req.params.phone;
  let { pageno, limit } = req.body;

  if (!pageno || !limit) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || limit < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (!phone) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );
  const [auths] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0 || auths.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let { token, password, otp, level, ...userInfo } = user[0];

  const [recharge] = await connection.query(
    `SELECT * FROM recharge WHERE phone = ? ORDER BY id DESC LIMIT ${pageno}, ${limit} `,
    [phone],
  );
  const [total_users] = await connection.query(
    `SELECT * FROM recharge WHERE phone = ?`,
    [phone],
  );
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: recharge,
    page_total: Math.ceil(total_users.length / limit),
  });
};

const listWithdrawMem = async (req, res) => {
  let auth = req.cookies.auth;
  let phone = req.params.phone;
  let { pageno, limit } = req.body;

  if (!pageno || !limit) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || limit < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (!phone) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );
  const [auths] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0 || auths.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let { token, password, otp, level, ...userInfo } = user[0];

  const [withdraw] = await connection.query(
    `SELECT * FROM withdraw WHERE phone = ? ORDER BY id DESC LIMIT ${pageno}, ${limit} `,
    [phone],
  );
  const [total_users] = await connection.query(
    `SELECT * FROM withdraw WHERE phone = ?`,
    [phone],
  );
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: withdraw,
    page_total: Math.ceil(total_users.length / limit),
  });
};

const listRedenvelope = async (req, res) => {
  let auth = req.cookies.auth;
  let phone = req.params.phone;
  let { pageno, limit } = req.body;

  if (!pageno || !limit) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || limit < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (!phone) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );
  const [auths] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0 || auths.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let { token, password, otp, level, ...userInfo } = user[0];

  const [redenvelopes_used] = await connection.query(
    `SELECT * FROM redenvelopes_used WHERE phone_used = ? ORDER BY id DESC LIMIT ${pageno}, ${limit} `,
    [phone],
  );
  const [total_users] = await connection.query(
    `SELECT * FROM redenvelopes_used WHERE phone_used = ?`,
    [phone],
  );
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: redenvelopes_used,
    page_total: Math.ceil(total_users.length / limit),
  });
};
// Level Setting get

const getLevelInfo = async (req, res) => {
  const [rows] = await connection.query("SELECT * FROM `level`");

  if (!rows) {
    return res.status(200).json({
      message: "Failed",
      status: false,
    });
  }
  console.log("asdasdasd : " + rows);
  return res.status(200).json({
    message: "Success",
    status: true,
    data: {},
    rows: rows,
  });

  // const [recharge] = await connection.query('SELECT * FROM recharge WHERE `phone` = ? AND status = 1', [rows[0].phone]);
  // let totalRecharge = 0;
  // recharge.forEach((data) => {
  //     totalRecharge += data.money;
  // });
  // const [withdraw] = await connection.query('SELECT * FROM withdraw WHERE `phone` = ? AND status = 1', [rows[0].phone]);
  // let totalWithdraw = 0;
  // withdraw.forEach((data) => {
  //     totalWithdraw += data.money;
  // });

  // const { id, password, ip, veri, ip_address, status, time, token, ...others } = rows[0];
  // return res.status(200).json({
  //     message: 'Success',
  //     status: true,
  //     data: {
  //         code: others.code,
  //         id_user: others.id_user,
  //         name_user: others.name_user,
  //         phone_user: others.phone,
  //         money_user: others.money,
  //     },
  //     totalRecharge: totalRecharge,
  //     totalWithdraw: totalWithdraw,
  //     timeStamp: timeNow,
  // });
};

const listBet = async (req, res) => {
  let auth = req.cookies.auth;
  let phone = req.params.phone;
  let { pageno, limit } = req.body;

  if (!pageno || !limit) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || limit < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (!phone) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ? ",
    [phone],
  );
  const [auths] = await connection.query(
    "SELECT * FROM users WHERE token = ? ",
    [auth],
  );

  if (user.length == 0 || auths.length == 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }
  let { token, password, otp, level, ...userInfo } = user[0];

  const [listBet] = await connection.query(
    `SELECT * FROM minutes_1 WHERE phone = ? AND status != 0 ORDER BY id DESC LIMIT ${pageno}, ${limit} `,
    [phone],
  );
  const [total_users] = await connection.query(
    `SELECT * FROM minutes_1 WHERE phone = ? AND status != 0`,
    [phone],
  );
  return res.status(200).json({
    message: "Success",
    status: true,
    datas: listBet,
    page_total: Math.ceil(total_users.length / limit),
  });
};

const apiListBet = async (req, res) => {
 
  let auth = req.cookies.auth;
  let phone = req.params.phone;
  let { pageno, limit } = req.body;

  if (!pageno || !limit) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (pageno < 0 || limit < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  if (!phone) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: new Date().toISOString(),
    });
  }

  const [user] = await connection.query(
    "SELECT * FROM users WHERE phone = ?",
    [phone]
  );
  const [auths] = await connection.query(
    "SELECT * FROM users WHERE token = ?",
    [auth]
  );

  if (user.length === 0 || auths.length === 0) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: new Date().toISOString(),
    });
  }


  let { token, password, otp, level, ...userInfo } = user[0];

 
  // Fetching bets from smartSofttransaction and spribetransaction tables
  const [listSmartSoft] = await connection.query(
    `SELECT * FROM smartSofttransaction WHERE phone = ?ORDER BY id DESC LIMIT ${pageno}, ${limit} `,
    [phone],
  );

  const [listSpribe] = await connection.query(
    `SELECT * FROM spribetransaction WHERE phone = ? ORDER BY id DESC LIMIT ${pageno}, ${limit} `,
    [phone],
  );


 
  // Combine both lists into a single list (if needed)
  const combinedList = [...listSmartSoft, ...listSpribe];

  // Calculate total pages based on the total number of records
  const [totalUsers] = await connection.query(
    `SELECT * FROM smartSofttransaction WHERE phone = ?`,
    [phone]
  );
  const [totalSpribe] = await connection.query(
    `SELECT * FROM spribetransaction WHERE phone = ?`,
    [phone]
  );
  const totalRecords = totalUsers.length + totalSpribe.length;

  console.log(totalRecords)

  return res.status(200).json({
    message: "Success",
    status: true,
    data: combinedList,
    page_total: Math.ceil(totalRecords / limit),
  });
};

const listOrderOld = async (req, res) => {
  let { gameJoin } = req.body;

  let checkGame = ["1", "3", "5", "10"].includes(String(gameJoin));
  if (!checkGame) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }
  let game = Number(gameJoin);

  let join = "";
  if (game == 1) join = "k5d";
  if (game == 3) join = "k5d3";
  if (game == 5) join = "k5d5";
  if (game == 10) join = "k5d10";

  const [k5d] = await connection.query(
    `SELECT * FROM 5d WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT 10 `,
  );
  const [period] = await connection.query(
    `SELECT period FROM 5d WHERE status = 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `,
  );
  const [waiting] = await connection.query(
    `SELECT phone, money, price, amount, bet FROM result_5d WHERE status = 0 AND level = 0 AND game = '${game}' ORDER BY id ASC `,
  );
  const [settings] = await connection.query(`SELECT ${join} FROM admin_ac`);
  if (k5d.length == 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }
  if (!k5d[0] || !period[0]) {
    return res.status(200).json({
      message: "Error!",
      status: false,
    });
  }
  return res.status(200).json({
    code: 0,
    msg: "Get success",
    data: {
      gameslist: k5d,
    },
    bet: waiting,
    settings: settings,
    join: join,
    period: period[0].period,
    status: true,
  });
};

const listOrderOldK3 = async (req, res) => {
  let { gameJoin } = req.body;

  let checkGame = ["1", "3", "5", "10"].includes(String(gameJoin));
  if (!checkGame) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }
  let game = Number(gameJoin);

  let join = "";
  if (game == 1) join = "k3d";
  if (game == 3) join = "k3d3";
  if (game == 5) join = "k3d5";
  if (game == 10) join = "k3d10";

  const [k5d] = await connection.query(
    `SELECT * FROM k3 WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT 10 `,
  );
  const [period] = await connection.query(
    `SELECT period FROM k3 WHERE status = 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `,
  );
  const [waiting] = await connection.query(
    `SELECT phone, money, price, typeGame, amount, bet FROM result_k3 WHERE status = 0 AND level = 0 AND game = '${game}' ORDER BY id ASC `,
  );
  const [settings] = await connection.query(`SELECT ${join} FROM admin_ac`);
  if (k5d.length == 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }
  if (!k5d[0] || !period[0]) {
    return res.status(200).json({
      message: "Error!",
      status: false,
    });
  }
  return res.status(200).json({
    code: 0,
    msg: "Get Success",
    data: {
      gameslist: k5d,
    },
    bet: waiting,
    settings: settings,
    join: join,
    period: period[0].period,
    status: true,
  });
};

const editResult = async (req, res) => {
  let { game, list } = req.body;

  if (!list || !game) {
    return res.status(200).json({
      message: "ERROR!!!",
      status: false,
    });
  }

  let join = "";
  if (game == 1) join = "k5d";
  if (game == 3) join = "k5d3";
  if (game == 5) join = "k5d5";
  if (game == 10) join = "k5d10";

  const sql = `UPDATE admin_ac SET ${join} = ?`;
  await connection.execute(sql, [list]);
  return res.status(200).json({
    message: "Editing is successful", //Register Sucess
    status: true,
  });
};

const editResult2 = async (req, res) => {
  let { game, list } = req.body;

  if (!list || !game) {
    return res.status(200).json({
      message: "ERROR!!!",
      status: false,
    });
  }

  let join = "";
  if (game == 1) join = "k3d";
  if (game == 3) join = "k3d3";
  if (game == 5) join = "k3d5";
  if (game == 10) join = "k3d10";

  const sql = `UPDATE admin_ac SET ${join} = ?`;
  await connection.execute(sql, [list]);
  return res.status(200).json({
    message: "Editing is successful", //Register Sucess
    status: true,
  });
};

const CreatedSalary = async (req, res) => {
  try {
    const phone = req.body.phone;
    const amount = req.body.amount;
    const type = req.body.type;
    const now = new Date().getTime();

    const formattedTime = now.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Check if the phone number is a 10-digit number
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        message:
          "ERROR!!! Invalid phone number. Please provide a 10-digit phone number.",
        status: false,
      });
    }

    // Check if user with the given phone number exists
    const checkUserQuery = "SELECT * FROM `users` WHERE phone = ?";
    const [existingUser] = await connection.execute(checkUserQuery, [phone]);

    if (existingUser.length === 0) {
      // If user doesn't exist, return an error
      return res.status(400).json({
        message: "ERROR!!! User with the provided phone number does not exist.",
        status: false,
      });
    }

    // If user exists, update the 'users' table
    const updateUserQuery =
      "UPDATE `users` SET `money` = `money` + ? WHERE phone = ?";
    await connection.execute(updateUserQuery, [amount, phone]);

    // Insert record into 'salary' table
    const insertSalaryQuery =
      "INSERT INTO salary (phone, amount, type, time) VALUES (?, ?, ?, ?)";
    await connection.execute(insertSalaryQuery, [phone, amount, type, now]);

    res.status(200).json({ message: "Salary record created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTodayStartTime = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
};

const userStats = async (startTime, endTime) => {
  const [rows] = await connection.query(
    `
      SELECT
          u.phone,
          u.invite,
          u.code,
          u.time,
          u.id_user,
          COALESCE(r.total_deposit_amount, 0) AS total_deposit_amount,
          COALESCE(r.total_deposit_number, 0) AS total_deposit_number,
          COALESCE(m.total_bets, 0) AS total_bets,
          COALESCE(m.total_bet_amount, 0) AS total_bet_amount,
          IF(ub.phone IS NOT NULL, 1, 0) AS has_bank_account
      FROM
          users u
      LEFT JOIN
          (
              SELECT
                  phone,
                  SUM(CASE WHEN status = 1 THEN COALESCE(money, 0) ELSE 0 END) AS total_deposit_amount,
                  COUNT(CASE WHEN status = 1 THEN phone ELSE NULL END) AS total_deposit_number
              FROM
                  recharge
              WHERE
                  time > ? AND time < ?
              GROUP BY
                  phone
          ) r ON u.phone = r.phone
      LEFT JOIN
          (
              SELECT 
                  phone,
                  COALESCE(SUM(total_bet_amount), 0) AS total_bet_amount,
                  COALESCE(SUM(total_bets), 0) AS total_bets
              FROM (
                  SELECT 
                      phone,
                      SUM(money + fee) AS total_bet_amount,
                      COUNT(*) AS total_bets
                  FROM minutes_1
                  WHERE time > ? AND time < ?
                  GROUP BY phone
                  UNION ALL
                  SELECT 
                      phone,
                      SUM(money + fee) AS total_bet_amount,
                      COUNT(*) AS total_bets
                  FROM trx_wingo_bets
                  WHERE time > ? AND time < ?
                  GROUP BY phone
              ) AS combined
              GROUP BY phone
          ) m ON u.phone = m.phone
      LEFT JOIN
          user_bank ub ON u.phone = ub.phone
      GROUP BY
          u.phone
      ORDER BY
          u.time DESC;
      `,
    [
      startTime,
      endTime,
      startTime,
      endTime,
      startTime,
      endTime,
      startTime,
      endTime,
    ],
  );

  return rows;
};

const createInviteMapAndLevels = (rows, userCode, maxLevel) => {
  const inviteMap = {};
  const userAllLevels = [];
  let totalRechargeCount = 0;
  const queue = [{ code: userCode, level: 1 }];

  while (queue.length) {
    const { code, level } = queue.shift();
    if (level >= maxLevel) continue;

    if (!inviteMap[code]) {
      inviteMap[code] = [];
    }

    const users = rows.filter((user) => user.invite === code);
    inviteMap[code].push(...users);

    users.forEach((user) => {
      if (
        level !== 1 &&
        user.total_bet_amount >= 500 &&
        user.has_bank_account
      ) {
        userAllLevels.push({ ...user, user_level: level });
        totalRechargeCount += +user.total_deposit_amount;
      }
      queue.push({ code: user.code, level: level + 1 });
    });
  }

  return { inviteMap, userAllLevels, totalRechargeCount };
};

const getUserLevels = (rows, userCode, maxLevel = 10) => {
  const { inviteMap, userAllLevels, totalRechargeCount } =
    createInviteMapAndLevels(rows, userCode, maxLevel);
  const level1Referrals = inviteMap[userCode].filter(
    (user) => user.total_bet_amount >= 500 && user.has_bank_account,
  );
  return { userAllLevels, level1Referrals, totalRechargeCount };
};

const listCheckSalaryEligibility = async (req, res) => {
  const { startOfYesterdayTimestamp, endOfYesterdayTimestamp } =
    yesterdayTime();
  const now = new Date().getTime();

  const userStatsData = await userStats(startOfYesterdayTimestamp, now);

  const users = userStatsData
    .map((user) => {
      const { userAllLevels, level1Referrals, totalRechargeCount } =
        getUserLevels(userStatsData, user.code);
      if (userAllLevels.length > 0 || level1Referrals.length > 0) {
        return {
          phone: user.phone,
          userAllLevelsEligibility: userAllLevels.length,
          level1ReferralsEligibility: level1Referrals.length,
          totalRechargeCount,
        };
      }
    })
    .filter(Boolean);

  return res.status(200).json({
    message: "Success",
    status: true,
    data: {},
    rows: users,
  });
};

const getSalary = async (req, res) => {
  const [rows] = await connection.query(
    `SELECT * FROM salary ORDER BY time DESC`,
  );

  if (!rows) {
    return res.status(200).json({
      message: "Failed",
      status: false,
    });
  }
  console.log("asdasdasd : " + rows);
  return res.status(200).json({
    message: "Success",
    status: true,
    data: {},
    rows: rows,
  });
};


const adminUpdateLevel = async (req, res) => {
  const { phone, level } = req.body;
  try {
    const [userss] = await connection.query(
      `SELECT * FROM users WHERE phone = ?`,
      [phone] // pass the phone as a parameter to the SELECT query
    );

    if (!userss.length) { // Check if the array is empty instead of null
      return res.status(200).json({
        message: "users not found",
        status: false,
      });
    }

    const [rows] = await connection.query(
      `UPDATE users SET level = ? WHERE phone = ?`,
      [level, phone] // pass both level and phone as parameters to the UPDATE query
    );

    return res.status(200).json({
      message: "User level updated successfully",
      status: true,
    });

  } catch (error) {
    return res.status(200).json({
      message: "Internal server error",
      status: false,
      error: error.message
    });
  }
};


function timerJoinFun(params = "", addHours = 0) {
  let date = params ? new Date(Number(params)) : new Date();
  if (addHours !== 0) {
    date.setHours(date.getHours() + addHours);
  }

  const options = {
    timeZone: "Asia/Kolkata", // Specify the desired time zone
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // 24-hour format
  };

  const formatter = new Intl.DateTimeFormat("en-GB", options);
  const parts = formatter.formatToParts(date);

  const getPart = (type) => parts.find((part) => part.type === type).value;

  const formattedDate = `${getPart("year")}-${getPart("month")}-${getPart(
    "day"
  )}`;

  return formattedDate;
}


const walletData = async (req, res) => {
  const sumdate = timerJoinFun(Date.now())

  const [users] = await connection.query(
    `SELECT SUM(money) as total FROM users WHERE status = 1  AND isdemo=0`,
  );
  const [usersTotal] = await connection.query(
    `SELECT COUNT(id) as total FROM users WHERE status = 1  AND isdemo=0`,
  );
  const [usersToday] = await connection.query(
    `SELECT COUNT(id) as total FROM users WHERE status = 1 AND DATE(today)=? AND isdemo=0`, [sumdate]
  );

  const [recharge] = await connection.query(
    `SELECT SUM(money) as total FROM recharge WHERE status = 1  AND isdemo=0 `,
  );
  const [withdraw] = await connection.query(
    `SELECT SUM(money) as total FROM withdraw WHERE status = 1 AND isdemo=0  `,
  );

  const [recharge_today] = await connection.query(
    `SELECT SUM(money) as total FROM recharge WHERE status = 1 AND DATE(bet_data) = ? AND isdemo=0 `,
    [sumdate],
  );
  const [withdraw_today] = await connection.query(
    `SELECT SUM(money) as total FROM withdraw WHERE status = 1 AND DATE(today) = ? AND isdemo=0 `,
    [sumdate],
  );


  const [recharge_pending] = await connection.query(
    `SELECT SUM(money) as total FROM recharge WHERE status = 0 AND isdemo=0 `,
  );
  const [withdraw_pending] = await connection.query(
    `SELECT SUM(money) as total FROM withdraw WHERE status = 0 AND isdemo=0 `
  );


  let usersWallet = users[0].total;

  let recharges = recharge[0].total;
  let withdraws = withdraw[0].total;
  return res.status(200).json({
    message: "Success",
    status: true,
    usersWallet: usersWallet,
    recharges: recharges,
    withdraws: withdraws,
    totalUser: usersTotal[0].total,
    todayUser: usersToday[0].total,
    pRecharge: recharge_pending[0].total,
    pWithdrawal: withdraw_pending[0].total,
    rechargeToday: recharge_today[0].total,
    withdrawToday: withdraw_today[0].total,
  });
};


const finaceManage = async (req, res) => {
  let phone = req.body.phone
  let rank = req.body.select

  try {
    await connection.query(
      `UPDATE users SET  level=1,rank=? WHERE phone = ?`,
      [rank, phone],
    );
console.log("oko",phone,rank)
    return res.status(200).json({
      message: "Success",
      status: true,
      data:rank
    })
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
      status: true,
      error:error.message

    })
  }
}



const settingneed = async (req, res) => {
    let auth = req.cookies.auth;
    let id_user = req.body.id_user;
    let buff_acc = req.body.buff_acc;
    let money_value = req.body.money_value;
    if (!id_user || !buff_acc || !money_value) {
        return res.status(200).json({
            message: 'Failed',
            status: false,
            timeStamp: timeNow,
        });
    }
    const [user_id] = await connection.query(`SELECT * FROM users WHERE id_user = ?`, [id_user]);

    if (user_id.length > 0) {
        if (buff_acc == '1') {
            await connection.query(`UPDATE users SET needbet = needbet + ? WHERE id_user = ?`, [money_value, id_user]);
        }
        if (buff_acc == '2') {
            await connection.query(`UPDATE users SET needbet = needbet - ? WHERE id_user = ?`, [money_value, id_user]);
        }
        return res.status(200).json({
            message: 'Successful change',
            status: true,
        });
    } else {
        return res.status(200).json({
            message: 'Successful change',
            status: false,
        });
    }
}

const adminController = {
  adminPage,
  adminPage3,
  adminPage5,
  adminPage10,
  totalJoin,
  middlewareAdminController,
  changeAdmin,
  membersPage,
  listMember,
  infoMember,
  userInfo,
  statistical,
  statistical2,
  rechargePage,
  recharge,
  rechargeDuyet,
  rechargeRecord,
  withdrawRecord,
  withdraw,
  levelSetting,
  handlWithdraw,
  settings,
  editResult2,
  settingBank,
  settingGet,
  settingCskh,
  settingbuff,
  register,
  ctvPage,
  listCTV,
  profileUser,
  ctvProfilePage,
  infoCtv,
  infoCtv2,
  giftPage,
  createBonus,
  listRedenvelops,
  banned,
  listRechargeMem,
  listWithdrawMem,
  getLevelInfo,
  listRedenvelope,
  listBet,
  adminPage5d,
  listOrderOld,
  listOrderOldK3,
  editResult,
  adminPageK3,
  updateLevel,
  CreatedSalaryRecord,
  CreatedSalary,
  DailySalaryEligibility,
  listCheckSalaryEligibility,
  getSalary,
  adminUpdateLevel,
  Wallets,
  addmoney,
  financeManager,
  walletData,
  demoUser,
  listdemoMember,
  finaceManage,
  apiListBet,
  settingneed
};

export default adminController;
