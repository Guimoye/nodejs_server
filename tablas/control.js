'use strict'

const express = require ('express')
const bodyParser = require ('body-parser')
const {Client} = require ('pg')
require('dotenv').config() //Toda la configuracion para entrar a posgrest

const app = express()

app.use(bodyParser.urlencoded({extended: false}))
module.exports.control = () =>  {
//__________________________________TABLA CONTROL__________________________________________
//_________Recibir todos los datos de la Tabla CONTROL______________
app.get('/control', (req , res) => {
    const client = new Client()
    client.connect()
    .then(()=>{
        return client.query('SELECT * FROM	control')
    })
    .then((results)=>{
        console.log ('results?', results)
        res.status(200).send(results)
    })
    .catch((err)=>{
        console.log("error", err)
        res.status(404).send({message: 'Error 404'})
    })
})
//________Enviar informacion a la Tabla CONTROL____________
app.post('/control/add', (req, res) => {
    console.log('post body', req.body)
    const client = new Client()
    client.connect()
        .then(()=>{
            res.status(200).send({message: 'Informacion enviada'})
            const sql = 'INSERT INTO control (con_fecha_hora, tar_mac, art_id_artefacto, con_estado, us_id_usuario) VALUES ($1, $2, $3, $4, $5)'
            const params = [req.body.con_fecha_hora, req.body.tar_mac, req.body.art_id_artefacto, req.body.con_estado, req.body.us_id_usuario]
            return client.query(sql, params)
        })
        .then((result)=>{
           console.log ('result?', result)
           res.send(result)
        })
        .catch((err)=>{
            console.log("err", err)
            res.status(404).send({message: 'Error 404'})
        })
})
//________Eliminar informacion de la Tabla CONTROL____________
app.post('/control/delete', (req, res) => {
    console.log('deleting id', req.body.id)
    const client = new Client()
    client.connect()
        .then(()=>{
            res.status(200).send({message: 'Informacion eliminada'})
            const sql = 'DELETE FROM control WHERE con_id_control = $1'
            const params = [req.body.con_id_control]
            return client.query(sql, params)
        })
        .then((results)=>{
            console.log ('delete results', results)
            res.send(results)
        })
        .catch((err)=>{
            console.log("err", err)
            res.status(404).send({message: 'Error 404'})
        })
})
//_____ Enviar informacion a la Tabla CONTROL para ser actualizada
app.post('/control/edit', (req, res) => {
    const client = new Client()
    client.connect()
        .then(()=>{
            res.status(200).send({message: 'Informacion actualizada'})  
            const sql = 'UPDATE control SET con_fecha_hora = $1, tar_mac = $2, art_id_artefacto = $3, con_estado = $4, us_id_usuario = $5 WHERE con_id_control = $6'
            const params = [req.body.con_fecha_hora, req.body.tar_mac, req.body.art_id_artefacto, req.body.con_estado, req.body.us_id_usuario, req.body.con_id_control]
            return client.query(sql, params)
        })
        .then((results)=>{
            console.log ('Update results', results)
            res.send(results)
        })
        .catch((err)=>{
            console.log("err", err)
            res.status(404).send({message: 'Error 404'})
        })
})    
}
