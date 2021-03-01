import resources = require('../resources');
import express = require('express');
const router = express.Router()

const authUser = resources.authUser;
const authPassword = resources.authPassword;

router.use((req, res, next) => {
  if (req.headers.host === `${process.env.HOST || 'localhost'}:${process.env.POST || 5000}`) {
    return next();
  }

  if (!authUser || !authPassword) {
    return next();
  }

  const token = req.cookies.token;

  if(token && token === 'valid') {
    return next();
  }

  const auth = req.headers.authorization;
  const setCookie = (token) => res.cookie('token', token, { maxAge: 900000 });
  if (auth) {
    const base64 = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/.exec(auth);
    if (base64) {
      let bufferObj = Buffer.from(base64[1], "base64");
      let base64String = bufferObj.toString("utf8");

      const userPass = /^([^:]*):(.*)$/.exec(base64String);
      if (userPass && userPass[1] === authUser && userPass[2] === authPassword) {
        setCookie('valid');
        return next();
      }
    }
  }

  res.header('WWW-Authenticate', 'Basic realm="User Visible Realm"');
  res.status(401).send();
})

module.exports = router;
