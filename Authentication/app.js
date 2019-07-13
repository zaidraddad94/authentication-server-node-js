const express = require('express')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser');
const decoder = require('jwt-decode')
const User = require('./User');
const roles = require('./roles');
const UserSession = require('./UserSession');
const app = express()
app.use(bodyParser.json());
const _ = require('underscore')

//////////////////////////////////////////////////// db ////////////////////////////////////////////////////////////////

const mongoose = require('mongoose');

mongoose.connect('mongodb://zaid:zaid-1994@ds253094.mlab.com:53094/authentication')

mongoose.Promise = global.Promise;



var db = mongoose.connection;


db.on('error', function () {
    console.log('mongoose connection error');
});

db.once('open', function () {
    console.log('mongoose connected successfully');
});
/////////////////////////////////////////////////////// midel ware ////////////////////////////////////////////////////////////////
app.use((req, res, next) => {

    //not protected endpoints 
    let nonSecurePaths = ['/', '/account/signup', '/account/signin', "/account/logout"];
    if (_.contains(nonSecurePaths, req.url)) {
        next();
    }else{


    // finde the token from the req
    const token = req.headers.authorization.split(" ")[1]
    // finde the role from the token 
    let role = decoder(token).role

console.log(role)

    //chick if the user loged in from the session 
    UserSession.find({
        userId: token
    }, (err, data) => {
        if (err){
            return res.send({
                success: false,
                message: "error grting the session",
                error : err
            });
        }else if (!(data.length == 0)) {

            roles.find({
                role: role
            }, (err, data) => {
                // console.log("zzzzzzzz ", data[0].arr)

                if (data[0].arr.includes(req.url)) { // if the role id is not incloded in the array of ids send that this move is not aloude 
                    next()
                } else {
                    return res.send({
                        success: false,
                        message: 'this  end point is not alowed '
                    });
                }


            }
            )
        } else {
            return res.send({
                success: false,
                message: 'plese log in '
            });
        }
    })

    }

})
//////////////////////////////////////////////////////////test/////////////////////////////////////////////////////
app.get('/test1', (req, res) => {



    return res.send({
        success: false,
        message: 'test1'
    });

})


app.get('/test2', (req, res) => {



    return res.send({
        success: false,
        message: 'test2'
    });

})

//////////////////////////////////////////////////////  signup  ///////////////////////////////////////////////////
//postman obj
// {
// 	"firstName" : "zaid",
// 	"lastName" :"zaiiiid",
// 	"password":"zaaaa",
// 	"email" : "zaid@gmao.com",
// 	"role" : "owner "
// }  
app.post('/account/signup', (req, res) => {
    // console.log( "scsds", req.body.firstName);

    //save req.body in obj called body 
    const { body } = req;
    //make const named  firstName,lastName,password,role and give them the values from body 
    const {
        firstName,
        lastName,
        password,
        role
    } = body;
    // make var cald email and save the eamle from body in it 
    let {
        email
    } = body;

    // console.log(firstName , lastName , password , email , role)

    if (!firstName || !lastName || !password || !email || !role) {
        return res.send({
            success: false,
            message: 'Error: one of the filds is blank.'
        });
    }

    email = email.toLowerCase(); // all emails should be lower case 

    //chick if the user already exist 
    User.find({
        email: email,
    }, (err, previousUsers) => {
        if (err) {
            return res.send({
                success: false,
                message: 'Error: Server error.'
            })
        } else if (previousUsers.length > 0) {
            return res.send({
                success: false,
                message: 'Error: Account already exists.'
            });
        }
        // if the user new 
        // take the schema of user fill it and save it in the data base 
        const newUser = new User();

        newUser.email = email;
        newUser.firstName = firstName;
        newUser.lastName = lastName;
        newUser.password = newUser.generateHash(password);
        newUser.role = role;
        newUser.save((err, user) => {
            if (err) {
                return res.send({
                    success: false,
                    message: 'Error: server error.'
                });
            }
            return res.send({
                success: true,
                message: 'Signed up'
            });
        });
    });
});
////////////////////////////////////////////////////// sign in  ///////////////////////////////////////////////////

// {
// 	"password":"zaaaa",
// 	"email" : "zaid@gmao.com"
// }




app.post('/account/signin', (req, res, next) => {
    const { body } = req;
    const {
        password
    } = body;
    let {
        email
    } = body;


    //email or password should not be empty 
    if (!password) {
        return res.send({
            success: false,
            message: 'Error: Email cannot be blank.'
        });
    }


    if (!email) {
        return res.send({
            success: false,
            message: 'Error: Email cannot be blank.'
        });
    }

    //make email lowercase
    email = email.toLowerCase();
    //finde the user using email 
    User.find({
        email: email
    }, (err, users) => {
        if (err) {
            return res.send({
                success: false,
                message: 'Error: server error.'
            });
        }
        if (users.length != 1) { // if ther is no data say that the email invalid
            return res.send({
                success: false,
                message: 'Error: email invalid.'
            });
        }

        const user = users[0]; // ther is data save it in var user 


        if (!user.validPassword(password)) { // chick if the pasword corect 
            return res.send({
                success: false,
                message: 'Error: Invalid Password.'
            });
        }
        // Otherwise correct user

        //genrate jwt using the user data 
        var token = user.generateJwt();

        //creat sition for him 
        const userSession = new UserSession();
        userSession.userId = token;
        userSession.save((err, doc) => {
            if (err) {
                return res.send({
                    success: false,
                    message: 'Error: server error.'
                });
            }
            return res.send({
                success: true,
                message: 'Valid sign in',
                token: token  ///send back the token to be saved in local storg and this token should be send to the back end in every requst 
            });
        })
    });
});



////////////////////////////////////////////////log out/////////////////////////////////////////////////////////////////////
app.post('/account/logout', (req, res) => {
    // Get the token
    let token = req.headers.authorization.split(" ")[1]
    // ?token = test
    console.log(token)
    // Verify the token is one of a kind and is not deleted

    UserSession.deleteOne({
        userId: token,
    }, (err) => {
        if (err) {
            return res.send({
                success: false,
                message: 'Error: server error'
            });
        }

        return res.send({
            success: true,
            message: 'Good bye! Please come again!'
        })

    })
});

/////////////////////////////////////////////midel ware //////////////////////////////////////

function xxx(req, res, id) {
    ////find the token in req 
    const token = req.headers.authorization.split(" ")[1]
    // finde the role from the token 
    let role = decoder(token).role



    //chick if the user loged in from the session 
    UserSession.find({
        userId: token
    }, (err, data) => {

        if (data.lenght == 0) {
            return res.send({
                status: 404,
                success: false,
                message: "you are not sigh in  / rerout to sigh in "
            });
        }
    })

    // finde all alwed end points for this role 
    roles.find({
        role: role
    }, (err, data) => {
        // console.log("zzzzzzzz ", data[0].arr)

        if (!data[0].arr.includes(id)) { // if the role id is not incloded in the array of ids send that this move is not aloude 
            return res.send({
                status: 404,
                success: false,
                message: "not outh"
            });
        }


    }
    )


    // if all good do nothing 







}







app.listen(5000, () => {
    console.log("server work ")
})