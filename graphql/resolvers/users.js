const User = require('../../models/User');
const { ApolloError } = require('apollo-server-errors')
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

module.exports = {
    Mutation: {
        async registerUser(_, {registerInput: {username, email, password} }) {
            // See if old use exists withe mail attempting to register
            const oldUser = await User.findOne({ email }); 

            // throw error if user exists
            if (oldUser) {
                throw new ApolloError('A user is already registered with email' + email, 'USER_ALREADY_EXISTS'); 
            }
            
            // encrypt password
            let encryptedPassword = await bcrypt.hash(password, 10); 
            
            // build mongoose model
            const newUser = new User({
                username: username,
                email: email.toLoweCase(),
                password: encryptedPassword
            }); 

            // create JWT - attatch to user model
            const token = jwt.sign(
                { user_id: newUser._id, email }, 
                "UNSAFE_STRING", 
                {
                    expiresIn: "2h"
                }
            ); 

            newUser.token = token;

            // save user in mongodb
            const res = await newUser.save(); 
            
            return {
                id: res.id,
                ...res._doc
            }
        },
        async loginUser(_, {loginInput: {email, password} }) {
            // see if user exists with email
            const user = await User.findOne({ email }); 
            
            // check if entered password equals encrypted password
            if (user && (await bcrypt.compare(password, user.password))) {
                 // create a new token 
                 const token = jwt.sign(
                    { user_id: newUser._id, email }, 
                    "UNSAFE_STRING", 
                    {
                        expiresIn: "2h"
                    }
                );
                // attach token to user model 
                user.token = token; 
                return {
                    id: user.id,
                    ...user._doc
                }
            }
            else {
                throw new ApolloError('Incorrect password', 'INCORRECT_PASSWORD'); 
            }
         }
    },
    Query: {
        user: (_, {ID}) => User.findById(ID)
    }
}