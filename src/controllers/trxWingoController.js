import moment from "moment";
import connection from "../config/connectDB.js";
import axios from "axios";
import _ from "lodash";
import GameRepresentationIds from "../constants/game_representation_id.js";
import { generatePeriod } from "../helpers/games.js";

export const TRX_WINGO_GAME_STATUS_MAP = {
  PENDING: 0,
  COMPLETED: 1,
};


const trxWingoBlockPage = async (req, res) => {
  return res.render("bet/trx_wingo/trx_block.ejs");
};

const trxWingoPage = async (req, res) => {
  return res.render("bet/trx_wingo/win.ejs");
};

const trxWingoPage3 = async (req, res) => {
  return res.render("bet/trx_wingo/win3.ejs");
};

const trxWingoPage5 = async (req, res) => {
  return res.render("bet/trx_wingo/win5.ejs");
};

const trxWingoPage10 = async (req, res) => {
  return res.render("bet/trx_wingo/win10.ejs");
};

const isNumber = (params) => {
  let pattern = /^[0-9]*\d$/;
  return pattern.test(params);
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
    seconds
  );
}

const commissions=async(auth,money)=>{
  const [user] = await connection.query('SELECT `phone`, `code`, `invite`, `user_level`, `total_money` FROM users WHERE token = ?', [auth]);
  let userInfo = user

    // commission
 

    const [level] = await connection.query('SELECT * FROM level ');

let checkTime2 = timerJoin(Date.now());


    let uplines2 = userInfo;     
    let count=0
    for (let i = 0; i < 6; i++) {
        const rosesFs = (money / 100) * level[i].f1        
        if (uplines2.length !== 0) {
            let [upline1] = await connection.query('SELECT * FROM users WHERE code = ?', [uplines2[0].invite]);          
             if (upline1.length > 0) {
                count++  
                   await connection.query('INSERT INTO subordinatedata SET phone = ?, bonusby=?, type = ?, commission=?, amount = ?, level=?, `date` = ?', [upline1[0].phone, uplines2[0].phone, "bet commission", rosesFs, money, count,checkTime2]);
                    await connection.query('UPDATE users SET money = money + ? WHERE phone = ? ', [rosesFs,upline1[0].phone]);  
             uplines2 = upline1;
            } else {
                break; // Exit the loop if no further uplines are found
            }
        } else {
            break; // Exit the loop if uplines2 is empty
        }
  }

}
const rosesPlus = async (auth, money) => {
  const [level] = await connection.query("SELECT * FROM level ");

  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `user_level`, `total_money` FROM users WHERE token = ? AND veri = 1 LIMIT 1 ",
    [auth],
  );
  let userInfo = user[0];
  const [f1] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `rank`, `user_level`, `total_money` FROM users WHERE code = ? AND veri = 1 LIMIT 1 ",
    [userInfo.invite],
  );

  if (userInfo.total_money >= 100) {
    if (f1.length > 0) {
      let infoF1 = f1[0];
      for (let levelIndex = 1; levelIndex <= 6; levelIndex++) {
        let rosesF = 0;
        if (infoF1.user_level >= levelIndex && infoF1.total_money >= 100) {
          rosesF = (money / 100) * level[levelIndex - 1].f1;
          if (rosesF > 0) {
            await connection.query(
              "UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ",
              [rosesF, rosesF, rosesF, infoF1.phone],
            );
            let timeNow = Date.now();
            const sql2 = `INSERT INTO roses SET 
                            phone = ?,
                            code = ?,
                            invite = ?,
                            f1 = ?,
                            time = ?`;
            await connection.query(sql2, [
              infoF1.phone,
              infoF1.code,
              infoF1.invite,
              rosesF,
              timeNow,
            ]);

            const sql3 = `
                            INSERT INTO turn_over (phone, code, invite, daily_turn_over, total_turn_over)
                            VALUES (?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                            daily_turn_over = daily_turn_over + VALUES(daily_turn_over),
                            total_turn_over = total_turn_over + VALUES(total_turn_over)
                            `;

            await connection.query(sql3, [
              infoF1.phone,
              infoF1.code,
              infoF1.invite,
              money,
              money,
            ]);
          }
        }
        const [fNext] = await connection.query(
          "SELECT `phone`, `code`, `invite`, `rank`, `user_level`, `total_money` FROM users WHERE code = ? AND veri = 1 LIMIT 1 ",
          [infoF1.invite],
        );
        if (fNext.length > 0) {
          infoF1 = fNext[0];
        } else {
          break;
        }
      }
    }
  }
};

export const TRX_WINGO_GAME_TYPE_MAP = {
  MIN_1: "trx_wingo",
  MIN_3: "trx_wingo3",
  MIN_5: "trx_wingo5",
  MIN_10: "trx_wingo10",
};


const betTrxWingo = async (req, res) => {
  try {
    let { typeid, join, x, money } = req.body;
    let auth = req.cookies.auth;

    if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
      return res.status(200).json({
        message: "Error! invalid id",
        status: true,
      });
    }

    let gameJoin = "";
    if (typeid == 1) gameJoin = "trx_wingo";
    if (typeid == 3) gameJoin = "trx_wingo3";
    if (typeid == 5) gameJoin = "trx_wingo5";
    if (typeid == 10) gameJoin = "trx_wingo10";
    const [trxWingoNow] = await connection.query(
      `SELECT period FROM trx_wingo_game WHERE status = 0 AND game = ? ORDER BY id DESC LIMIT 1 `,
      [gameJoin],
    );
    const [user] = await connection.query(
      "SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
      [auth],
    );
    if (!trxWingoNow[0] || !user[0] || !isNumber(x) || !isNumber(money)) {
      return res.status(200).json({
        message: "Error! user",
        status: true,
      });
    }

    let userInfo = user[0];
    let period = trxWingoNow[0].period;
    let fee = x * money * 0.02;
    let total = x * money - fee;
    let timeNow = Date.now();
    let check = userInfo.money - total;

    let date = new Date();
    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());
    let id_product =
      years + months + days + Math.floor(Math.random() * 1000000000000000);

    let formatTime = timerJoin();

    let color = "";
    if (join == "l") {
      color = "big";
    } else if (join == "n") {
      color = "small";
    } else if (join == "t") {
      color = "violet";
    } else if (join == "d") {
      color = "red";
    } else if (join == "x") {
      color = "green";
    } else if (join == "0") {
      color = "red-violet";
    } else if (join == "5") {
      color = "green-violet";
    } else if (join % 2 == 0) {
      color = "red";
    } else if (join % 2 != 0) {
      color = "green";
    }

    let checkJoin = "";

    if ((!isNumber(join) && join == "l") || join == "n") {
      checkJoin = `
        <div data-v-a9660e98="" class="van-image" style="width: 30px; height: 30px;">
            <img src="/images/${join == "n" ? "small" : "big"}.png" class="van-image__img">
        </div>
        `;
    } else {
      checkJoin = `
        <span data-v-a9660e98="">${isNumber(join) ? join : ""}</span>
        `;
    }

    let result = `
    <div data-v-a9660e98="" issuenumber="${period}" addtime="${formatTime}" rowid="1" class="hb">
        <div data-v-a9660e98="" class="item c-row">
            <div data-v-a9660e98="" class="result">
                <div data-v-a9660e98="" class="select select-${color}">
                    ${checkJoin}
                </div>
            </div>
            <div data-v-a9660e98="" class="c-row c-row-between info">
                <div data-v-a9660e98="">
                    <div data-v-a9660e98="" class="issueName">
                        ${period}
                    </div>
                    <div data-v-a9660e98="" class="tiem">${formatTime}</div>
                </div>
            </div>
        </div>
        <!---->
    </div>
    `;

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
    let checkTime = timerJoin(date.getTime());

    if (check >= 0) {
      const sql = `INSERT INTO trx_wingo_bets SET 
            id_product = ?,
            phone = ?,
            code = ?,
            invite = ?,
            stage = ?,
            level = ?,
            money = ?,
            amount = ?,
            fee = ?,
            get = ?,
            game = ?,
            bet = ?,
            status = ?,
            today = ?,
            time = ?`;
      await connection.query(sql, [
        id_product,
        userInfo.phone,
        userInfo.code,
        userInfo.invite,
        period,
        userInfo.level,
        total,
        x,
        fee,
        0,
        gameJoin,
        join,
        0,
        checkTime,
        timeNow,
      ]);
      await connection.query(
        "UPDATE `users` SET `money` = `money` - ? WHERE `token` = ? ",
        [money * x, auth],
      );
      const [users] = await connection.query(
        "SELECT `money`, `level` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
        [auth],
      );
      await rosesPlus(auth, money * x);
      await commissions(auth, money * x)

      return res.status(200).json({
        message: "Successful bet",
        status: true,
        data: result,
        change: users[0].level,
        money: users[0].money,
      });
    } else {
      return res.status(200).json({
        message: "The amount is not enough",
        status: false,
      });
    }
  } catch (error) {
    // console.log("object",error)
    return res.status(200).json({
      message: "Internal server error",
      status: false,
      error:error.message
    });
  }
};

const listOrderOld = async (req, res) => {
  let { typeid, pageno, pageto } = req.body;

  if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
    return res.status(200).json({
      message: "Error!",
      status: true,
    });
  }
  if (pageno < 0 || pageto < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      page: 1,
      status: false,
    });
  }
  let auth = req.cookies.auth;
  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
    [auth],
  );

  let game = "";
  if (typeid == 1) game = TRX_WINGO_GAME_TYPE_MAP.MIN_1;
  if (typeid == 3) game = TRX_WINGO_GAME_TYPE_MAP.MIN_3;
  if (typeid == 5) game = TRX_WINGO_GAME_TYPE_MAP.MIN_5;
  if (typeid == 10) game = TRX_WINGO_GAME_TYPE_MAP.MIN_10;

  const [trx_wingo] = await connection.query(
    "SELECT * FROM trx_wingo_game WHERE status != 0 AND game = ? ORDER BY id DESC LIMIT ?, ?",
    [game, Number(pageno), Number(pageto)],
  );

  const [trx_wingoAll] = await connection.query(
    "SELECT COUNT(*) as game_length FROM trx_wingo_game WHERE status != 0 AND game = ?",
    [game],
  );
  const [period] = await connection.query(
    "SELECT period FROM trx_wingo_game WHERE status = 0 AND game = ? ORDER BY id DESC LIMIT 1",
    [game],
  );
  if (!trx_wingo[0]) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      page: 1,
      status: false,
    });
  }

  if (!pageno || !pageto || !user[0] || !trx_wingo[0] || !period[0]) {
    return res.status(200).json({
      message: "Error!",
      status: true,
    });
  }

  let page = Math.ceil(trx_wingoAll[0].game_length / 10);

  return res.status(200).json({
    code: 0,
    msg: "Receive success",
    data: {
      gameslist: trx_wingo,
    },
    period: period[0].period,
    page: page,
    status: true,
  });
};

const GetMyEmerdList = async (req, res) => {
  let { typeid, pageno, pageto } = req.body;

  // if (!pageno || !pageto) {
  //     pageno = 0;
  //     pageto = 10;
  // }

  if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
    return res.status(200).json({
      message: "Error!",
      status: true,
    });
  }

  if (pageno < 0 || pageto < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      page: 1,
      status: false,
    });
  }
  let auth = req.cookies.auth;

  let game = "";
  if (typeid == 1) game = "trx_wingo";
  if (typeid == 3) game = "trx_wingo3";
  if (typeid == 5) game = "trx_wingo5";
  if (typeid == 10) game = "trx_wingo10";

  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1 LIMIT 1",
    [auth],
  );
  const [trx_wingo_bets] = await connection.query(
    "SELECT * FROM trx_wingo_bets WHERE phone = ? AND game = ? ORDER BY id DESC LIMIT ?, ?",
    [user[0].phone, game, Number(pageno), Number(pageto)],
  );
  const [trx_wingo_betsAll] = await connection.query(
    "SELECT COUNT(*) as bet_length FROM trx_wingo_bets WHERE phone = ? AND game = ? ORDER BY id DESC",
    [user[0].phone, game],
  );

  if (!trx_wingo_bets[0]) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      page: 1,
      status: false,
    });
  }
  if (!pageno || !pageto || !user[0] || !trx_wingo_bets[0]) {
    return res.status(200).json({
      message: "Error!",
      status: true,
    });
  }

  let page = Math.ceil(trx_wingo_betsAll[0].bet_length / 10);

  let datas = trx_wingo_bets.map((data) => {
    let { id, phone, code, invite, level, game, ...others } = data;
    return others;
  });

  return res.status(200).json({
    code: 0,
    msg: "Receive success",
    data: {
      gameslist: datas,
    },
    page: page,
    status: true,
  });
};

function minutesPassedSince(time) {
  const inputTime = moment(time);
  const minutesDiff = moment().diff(inputTime, "minutes");
  return minutesDiff;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const generateResultByHash = (hash) => {
  const hashItemList = hash.split("");

  let Result = "";
  for (let index = 0; index < hashItemList.length; index++) {
    const hashItem = hashItemList[hashItemList.length - 1 - index];

    const NUMBER_LIST = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const isNumber = NUMBER_LIST.includes(hashItem);
    if (isNumber) {
      Result = hashItem;
      break;
    }
  }

  return Result;
};

function getNthMinuteSinceDayStart() {
  const now = moment();
  const startOfDay = moment().startOf("day");
  const diff = now.diff(startOfDay, "minutes");
  return diff;
}

const addTrxWingo = async (game) => {
  try {
    let join = "";
    if (game == 1) join = TRX_WINGO_GAME_TYPE_MAP.MIN_1;
    if (game == 3) join = TRX_WINGO_GAME_TYPE_MAP.MIN_3;
    if (game == 5) join = TRX_WINGO_GAME_TYPE_MAP.MIN_5;
    if (game == 10) join = TRX_WINGO_GAME_TYPE_MAP.MIN_10;

    // console.log(join)

    const [trxWingoNow] = await connection.query(
      "SELECT period FROM trx_wingo_game WHERE status = 0 AND game = ? ORDER BY id DESC LIMIT 1",
      [join],
    );

    const isPendingGame = trxWingoNow.length;
    const PendingGamePeriod = trxWingoNow?.[0]?.period
      ? parseInt(trxWingoNow?.[0]?.period)
      : 0;

    if (isPendingGame) {
      // console.log("TRX WINGO GAME PENDING GAME INSERTIONS Start")
      const isAdminManipulatedResult = false;

      if (isAdminManipulatedResult) {
      } else {
        let response = await axios({
          method: "GET",
          url: "https://apilist.tronscanapi.com/api/block?sort=-balance&start=0&limit=20&producer=&number=&start_timestamp=&end_timestamp=",
          headers: {
            "TRON-PRO-API-KEY": process.env.TRON_API_KEY,
          },
        });

        const NextBlock = response.data.data
          .map((item) => {
            return {
              id: item.number,
              hash: item.hash,
              blockTime: item.timestamp,
              timeSS: moment(item.timestamp).format("ss"),
            };
          })
          .find((item) => item.timeSS === "54");

        if (NextBlock === undefined) {
          throw new Error("NextBlock is undefined");
        }

        const BlockId = NextBlock.id;
        const BlockTime = NextBlock.blockTime;
        const Hash = NextBlock.hash;

        let Result = generateResultByHash(Hash);

        // console.log({
        //    BlockId,
        //    BlockTime: moment(BlockTime).format("HH:mm:ss"),
        //    Hash,
        //    Result,
        // })

        await connection.query(
          `
               UPDATE trx_wingo_game
               SET result = ?, status = ?, block_id = ?, block_time = ?, hash = ?, release_status = 1
               WHERE period = ? AND game = ?
               `,
          [
            Result,
            TRX_WINGO_GAME_STATUS_MAP.COMPLETED,
            BlockId,
            BlockTime,
            Hash,
            PendingGamePeriod,
            join,
          ],
        );

        // console.log("TRX WINGO GAME PENDING GAME INSERTIONS Successfully")
      }
    }

    let gameRepresentationId = GameRepresentationIds.TRXWINGO[game];
    let NewGamePeriod = generatePeriod(gameRepresentationId);

    let timeNow = Date.now();

    const [trxWinGoTest] = await connection.query(
      "SELECT period FROM trx_wingo_game WHERE period = ? AND game = ?",
      [NewGamePeriod, join],
    );

    if (trxWinGoTest.length > 0) {
      return;
    }

    await connection.query(
      "INSERT INTO trx_wingo_game SET period = ?, result = 0, game = ?, status = 0, block_id = 0, block_time = '', hash = '', time = ?",
      [NewGamePeriod, join, timeNow],
    );
    
    // console.log("TRX WINGO GAME INSERT SUCCESSFULLY")
  } catch (error) {
    // if (error?.response?.status === 403) {
    //   console.log("API Quota Exceeded for 30 seconds");
    // //   console.log(error.response.data.Error);
    // } else console.log(error);
  }
};

const handlingTrxWingo1P = async (typeid) => {
  try {
    let game = "";
    if (typeid == 1) game = "trx_wingo";
    if (typeid == 3) game = "trx_wingo3";
    if (typeid == 5) game = "trx_wingo5";
    if (typeid == 10) game = "trx_wingo10";

    const [trxWingoNow] = await connection.query(
      "SELECT * FROM trx_wingo_game WHERE status = 1 AND release_status = 1 AND game = ? ORDER BY id DESC LIMIT 1",
      [game],
    );

    if (trxWingoNow.length === 0) {
      return;
    }

    // update ket qua
    await connection.query(
      "UPDATE trx_wingo_bets SET result = ? WHERE status = 0 AND game = ?",
      [trxWingoNow[0].result, game],
    );

    let result = Number(trxWingoNow[0].result);
    switch (result) {
      case 0:
        await connection.query(
          'UPDATE trx_wingo_bets SET status = 2 WHERE status = 0 AND game = ? AND bet NOT IN ("l", "n", "d", "0", "t")',
          [game],
        );
        break;
      case 1:
        await connection.query(
          'UPDATE trx_wingo_bets SET status = 2 WHERE status = 0 AND game = ? AND bet NOT IN ("l", "n", "x", "1")',
          [game],
        );
        break;
      case 2:
        await connection.query(
          'UPDATE trx_wingo_bets SET status = 2 WHERE status = 0 AND game = ? AND bet NOT IN ("l", "n", "d", "2")',
          [game],
        );
        break;
      case 3:
        await connection.query(
          'UPDATE trx_wingo_bets SET status = 2 WHERE status = 0 AND game = ? AND bet NOT IN ("l", "n", "x", "3")',
          [game],
        );
        break;
      case 4:
        await connection.query(
          'UPDATE trx_wingo_bets SET status = 2 WHERE status = 0 AND game = ? AND bet NOT IN ("l", "n", "d", "4")',
          [game],
        );
        break;
      case 5:
        await connection.query(
          'UPDATE trx_wingo_bets SET status = 2 WHERE status = 0 AND game = ? AND bet NOT IN ("l", "n", "x", "5", "t")',
          [game],
        );
        break;
      case 6:
        await connection.query(
          'UPDATE trx_wingo_bets SET status = 2 WHERE status = 0 AND game = ? AND bet NOT IN ("l", "n", "d", "6")',
          [game],
        );
        break;
      case 7:
        await connection.query(
          'UPDATE trx_wingo_bets SET status = 2 WHERE status = 0 AND game = ? AND bet NOT IN ("l", "n", "x", "7")',
          [game],
        );
        break;
      case 8:
        await connection.query(
          'UPDATE trx_wingo_bets SET status = 2 WHERE status = 0 AND game = ? AND bet NOT IN ("l", "n", "d", "8")',
          [game],
        );
        break;
      case 9:
        await connection.query(
          'UPDATE trx_wingo_bets SET status = 2 WHERE status = 0 AND game = ? AND bet NOT IN ("l", "n", "x", "9")',
          [game],
        );
        break;
      default:
        break;
    }

    if (result < 5) {
      await connection.query(
        'UPDATE trx_wingo_bets SET status = 2 WHERE status = 0 AND game = ? AND bet = "l"',
        [game],
      );
    } else {
      await connection.query(
        'UPDATE trx_wingo_bets SET status = 2 WHERE status = 0 AND game = ? AND bet = "n"',
        [game],
      );
    }

    // lấy ra danh sách đặt cược chưa xử lý
    const [order] = await connection.query(
      "SELECT * FROM trx_wingo_bets WHERE status = 0 AND game = ?",
      [game],
    );
    for (let i = 0; i < order.length; i++) {
      let orders = order[i];
      let result = orders.result;
      let bet = orders.bet;
      let total = orders.money;
      let id = orders.id;
      let phone = orders.phone;
      var nhan_duoc = 0;
      // x - green
      // t - Violet
      // d - red

      // Sirf 1-4 aur 6-9 tk hi *9 aana chahiye
      // Aur 0 aur 5 pe *4.5
      // Aur red aur green pe *2
      // 1,2,3,4,6,7,8,9

      if (bet == "l" || bet == "n") {
        nhan_duoc = total * 2;
      } else {
        if (result == 0 || result == 5) {
          if (bet == "d" || bet == "x") {
            nhan_duoc = total * 1.5;
          } else if (bet == "t") {
            nhan_duoc = total * 4.5;
          } else if (bet == "0" || bet == "5") {
            nhan_duoc = total * 4.5;
          }
        } else {
          if (result == 1 && bet == "1") {
            nhan_duoc = total * 9;
          } else {
            if (result == 1 && bet == "x") {
              nhan_duoc = total * 2;
            }
          }
          if (result == 2 && bet == "2") {
            nhan_duoc = total * 9;
          } else {
            if (result == 2 && bet == "d") {
              nhan_duoc = total * 2;
            }
          }
          if (result == 3 && bet == "3") {
            nhan_duoc = total * 9;
          } else {
            if (result == 3 && bet == "x") {
              nhan_duoc = total * 2;
            }
          }
          if (result == 4 && bet == "4") {
            nhan_duoc = total * 9;
          } else {
            if (result == 4 && bet == "d") {
              nhan_duoc = total * 2;
            }
          }
          if (result == 6 && bet == "6") {
            nhan_duoc = total * 9;
          } else {
            if (result == 6 && bet == "d") {
              nhan_duoc = total * 2;
            }
          }
          if (result == 7 && bet == "7") {
            nhan_duoc = total * 9;
          } else {
            if (result == 7 && bet == "x") {
              nhan_duoc = total * 2;
            }
          }
          if (result == 8 && bet == "8") {
            nhan_duoc = total * 9;
          } else {
            if (result == 8 && bet == "d") {
              nhan_duoc = total * 2;
            }
          }
          if (result == 9 && bet == "9") {
            nhan_duoc = total * 9;
          } else {
            if (result == 9 && bet == "x") {
              nhan_duoc = total * 2;
            }
          }
        }
      }
      const [users] = await connection.query(
        "SELECT `money` FROM `users` WHERE `phone` = ?",
        [phone],
      );
      let totals = parseFloat(users[0].money) + parseFloat(nhan_duoc);
      await connection.query(
        "UPDATE `trx_wingo_bets` SET `get` = ?, `status` = 1 WHERE `id` = ?",
        [parseFloat(nhan_duoc), id],
      );
      const sql = "UPDATE `users` SET `money` = ? WHERE `phone` = ?";
      await connection.query(sql, [totals, phone]);
    }

    await connection.query(
      "UPDATE trx_wingo_game SET release_status = 2 WHERE period = ? AND game = ?",
      [trxWingoNow[0].period, game],
    );
  } catch (error) {
    // console.log(error);
  }
};

const trxWingoController = {
  trxWingoPage,
  betTrxWingo,
  listOrderOld,
  GetMyEmerdList,
  handlingTrxWingo1P,
  addTrxWingo,
  trxWingoPage3,
  trxWingoPage5,
  trxWingoPage10,
  trxWingoBlockPage,
};

export default trxWingoController;
