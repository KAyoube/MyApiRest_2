// IMPORTS des pasckages npm que l'ont va use
let express = require('express')
let bodyParser = require('body-parser')


// IMPORTS des pasckages que l'ont va use via dossier
let apiRouter = require('./apiRouter').router

//---
let server = express()

server.use(bodyParser.urlencoded({extended:true}))
server.use(bodyParser.json())

//-- routes

server.get('/',(request,response) => {
    response.setHeader('Content-Type','text/html')
    response.status(200).send('<h1> Bonjour Jarvis</h1>')
})

// Router API
server.use('/api/',apiRouter)


// PORT du localhost

server.listen(8092,()=>{
    console.log('Serveur en marche maitre(8080)');
})

