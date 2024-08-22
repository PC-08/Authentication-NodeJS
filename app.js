const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
const bcrypt = require('bcrypt')
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

app.post('/register/', async (request, response) => {
  const newUserInfo = request.body
  const {username, name, password, gender, location} = newUserInfo
  const hashedPasword = await bcrypt.hash(password, 10)
  const checkUserQuery = `
  SELECT * FROM 
  user
  WHERE
  username = '${username}'`

  const checkUser = await db.get(checkUserQuery)

  if (checkUser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      if (checkUser === undefined) {
        const addUserQuery = `
            INSERT INTO 
            user (username,name,password,gender,location)
            VALUES(
              '${username}',
              '${name}',
              '${hashedPasword}',
              '${gender}',
              '${location}'
            )`

        await db.run(addUserQuery)
        response.send('User created successfully')
      }
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login/', async (request, response) => {
  const userInfo = request.body
  const {username, password} = userInfo

  const checkUserQuery = `
  SELECT * FROM 
  user
  WHERE
  username = '${username}'`

  const checkUser = await db.get(checkUserQuery)

  if (checkUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordmatched = await bcrypt.compare(password, checkUser.password)
    if (isPasswordmatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body

  const checkUserQuery = `
  SELECT * FROM 
  user
  WHERE
  username = '${username}'`

  const checkUser = await db.get(checkUserQuery)
  const comparepassword = await bcrypt.compare(oldPassword, checkUser.password)
  if (comparepassword === true) {
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashedPasword = await bcrypt.hash(newPassword, 10)
      const updateUserPasswordQuery = `
      UPDATE user
      SET 
      password = '${hashedPasword}'
      WHERE 
      username = '${checkUser.username}'
      `
      await db.run(updateUserPasswordQuery)
      response.send('Password updated')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

module.exports = app
