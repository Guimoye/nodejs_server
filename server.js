"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("pg");
require("dotenv").config(); //Toda la configuracion para entrar a posgrest

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

var username = 'javi2rrr';
var password = '12345678';
//var auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");

console.log(auth);


var request = require("request");

var options = { method: 'POST',
  url: 'https://api.cloudmqtt.com/api/user',
  headers: 
   { 'content-type': 'application/x-www-form-urlencoded',
     'postman-token': 'fa792278-a338-cc25-759f-c73d4688ddb0',
     'cache-control': 'no-cache',
     authorization: 'Basic amF2aTJycnI6MTIzNDU2Nzg'  },
  form: { username: 'javierrr20', password: '12345678' } };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});






/****************************** TABLA CONTROL ******************************/

//ver todas las tarjetas que controlan
app.post("/control", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      return client.query(`SELECT C.con_id_control, C.con_fecha_hora, C.con_mac, C.con_estado, 
      C.art_id_artefacto, C.us_id_usuario, C.con_borrar, 
      Z.zo_id_zona, C.mo_id_modulo, C.con_topic, 
      C.con_pattern, A.art_artefacto, Z.zo_zona, M.mo_nombre_modulo
      FROM control C 
      inner join artefacto A
      on C.art_id_artefacto = A.art_id_artefacto
      inner join zona Z
      on Z.zo_id_zona = A.zo_id_zona 
      inner join modulo M
      on M.mo_id_modulo = C.mo_id_modulo 
      inner join Usuario U 
      on C.us_id_usuario = U.us_id_usuario
      where 
      C.con_borrar = '0' and 
      A.art_borrar = '0' and 
      Z.zo_borrar = '0' and 
      M.mo_borrar = '0' and 
      U.us_id_usuario = '${req.body.us_id_usuario}' 
      limit 30 `);
    })
    .then(result => {
      if (result.rowCount != 0) res.send(result.rows);
      //res.status(200).send(results.rows);
      else {
        res.status(200).send({
          message: "no posee ninguna tarjeta registrada",
          error: "0"
        });
      }
    })
    .catch(err => {
      res.status(404).send({
        message:
          "ha ocurrido un error un su peticion, al tratar de consultar las tarjetas",
        error: "1"
      });
    });
});

//registrar control
app.post("/control/add", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //verficar si existe control
      return client.query(
        `SELECT C.con_id_control, C.con_fecha_hora, C.con_mac, C.con_estado, 
        C.art_id_artefacto, C.us_id_usuario, C.con_borrar, Z.zo_id_zona, C.mo_id_modulo, 
        C.con_topic, C.con_pattern, A.art_artefacto, Z.zo_zona, M.mo_nombre_modulo
        FROM control C 
        inner join artefacto A
        on C.art_id_artefacto = A.art_id_artefacto
        inner join zona Z
        on Z.zo_id_zona = A.zo_id_zona 
        inner join modulo M
        on M.mo_id_modulo = C.mo_id_modulo 
        inner join Usuario U 
        on C.us_id_usuario = U.us_id_usuario
        where 
        C.con_borrar = '0' and 
        A.art_borrar = '0' and 
        Z.zo_borrar = '0' and 
        M.mo_borrar = '0' and 
        C.con_mac='${req.body.con_mac}' or 
        C.con_pattern='${req.body.con_pattern}'`
      );
    })
    .then(results => {
      //sino existe debe registrar
      if (results.rowCount == 0) {
        const client = new Client();
        client
          .connect()
          .then(() => {
            const sql = `INSERT INTO control(
              con_fecha_hora, con_mac, con_estado, art_id_artefacto, us_id_usuario, 
              con_borrar, con_topic, con_pattern, mo_id_modulo)
              VALUES ($1, $2, $3, $4, $5, 0, 'topic', $6, $7)`;
            const params = [
              req.body.con_fecha_hora,
              req.body.con_mac,
              req.body.con_estado,
              req.body.art_id_artefacto,
              req.body.us_id_usuario,
              req.body.con_pattern,
              req.body.mo_id_modulo
            ];

            return client.query(sql, params);
          })
          .then(result => {
            res.status(200).send({ message: "registro exitoso", error: "0" });
          })
          .catch(err => {
            console.log("err", err);
            res.status(404).send({
              message: "ha ocurrido un error un su peticion",
              error: "1"
            });
          });
      } else {
        res.status(200).send({
          message:
            "ya existe una tarjeta de control con la misma mac o el pattern",
          error: "0"
        });
      }
    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({
        message: "ha ocurrido un error un su peticion",
        error: "1"
      });
    });
});

//eliminar control
app.post("/control/delete", (req, res) => {
  console.log("deleting id", req.body.id);
  const client = new Client();
  client
    .connect()
    .then(() => {
      res.status(200).send({ message: "Informacion eliminada" });
      const sql = `UPDATE control SET con_borrar='1' WHERE con_id_control = $1`;
      const params = [req.body.con_id_control];
      return client.query(sql, params);
    })
    .then(results => {
      console.log("delete results", results);
      res.send(results);
    })
    .catch(err => {
      console.log("err", err);
      res.status(404).send({ message: "Error 404" });
    });
});

//editar control
app.post("/control/edit", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //verficar si existe control
      return client.query(
        `SELECT C.con_id_control, C.con_fecha_hora, C.con_mac, C.con_estado, 
        C.art_id_artefacto, C.us_id_usuario, C.con_borrar, Z.zo_id_zona, C.mo_id_modulo, 
        C.con_topic, C.con_pattern, A.art_artefacto, Z.zo_zona, M.mo_nombre_modulo
        FROM control C 
        inner join artefacto A
        on C.art_id_artefacto = A.art_id_artefacto
        inner join zona Z
        on Z.zo_id_zona = A.zo_id_zona 
        inner join modulo M
        on M.mo_id_modulo = C.mo_id_modulo 
        inner join Usuario U 
        on C.us_id_usuario = U.us_id_usuario
        where 
        C.con_borrar = '0' and 
        A.art_borrar = '0' and 
        Z.zo_borrar = '0' and 
        M.mo_borrar = '0' and 
        C.con_mac='${req.body.con_mac}' or 
        C.con_pattern='${req.body.con_pattern}'`
      );
    })
    .then(results => {
      //sino existe debe registrar
      if (results.rowCount == 0) {
        const client = new Client();
        client
          .connect()
          .then(() => {
            const sql = `UPDATE control SET 
            con_fecha_hora = $2, 
            con_mac = $3, 
            con_estado = $4, 
            art_id_artefacto = $5, 
            us_id_usuario = $6, 
            con_pattern = $7, 
            mo_id_modulo = $8 
            WHERE 
            con_id_control = $1`;

            const params = [
              req.body.con_id_control,
              req.body.con_fecha_hora,
              req.body.con_mac,
              req.body.con_estado,
              req.body.art_id_artefacto,
              req.body.us_id_usuario,
              req.body.con_pattern,
              req.body.mo_id_modulo
            ];
            return client.query(sql, params);
          })
          .then(result => {
            res
              .status(200)
              .send({ message: "registro modificado con exitoso", error: "0" });
          })
          .catch(err => {
            console.log("err", err);
            res.status(404).send({
              message: "ha ocurrido un error un su peticion",
              error: "1"
            });
          });
      } else {
        res.status(200).send({
          message:
            "ya existe una tarjeta de control con la misma mac o el pattern",
          error: "0"
        });
      }
    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({
        message: "ha ocurrido un error un su peticion",
        error: "1"
      });
    });
});

//like control
app.post("/control/like", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      const sql = `SELECT C.con_id_control, C.con_fecha_hora, C.con_mac, C.con_estado, 
      C.art_id_artefacto, C.us_id_usuario, C.con_borrar, 
      Z.zo_id_zona, C.mo_id_modulo, C.con_topic, 
      C.con_pattern, A.art_artefacto, Z.zo_zona, M.mo_nombre_modulo
      FROM control C 
      inner join artefacto A
      on C.art_id_artefacto = A.art_id_artefacto
      inner join zona Z
      on Z.zo_id_zona = A.zo_id_zona 
      inner join modulo M
      on M.mo_id_modulo = C.mo_id_modulo 
      inner join Usuario U 
      on C.us_id_usuario = U.us_id_usuario
      where 
      C.con_borrar = '0' and 
      A.art_borrar = '0' and 
      Z.zo_borrar = '0' and 
      M.mo_borrar = '0' and 
      U.us_id_usuario = '${req.body.us_id_usuario}' and C.con_mac Like '${
        req.body.search
      }%' limit 30 `;

      return client.query(sql);
    })
    .then(results => {
      //si consiguio envia
      if (results.rowCount != 0) res.status(200).send(results.rows);
      else res.status(200).send({ message: "nada" }); //sino consiguio envia envia un msj diciendo nada
    })
    .catch(err => {
      res.status(404).send({
        message: "ha ocurrido un error un su peticion de busqueda",
        error: "1"
      });
    });
});

/****************************** TABLA USUARIO ******************************/
//seleccionar todos los web del admin, distribuidor, seleccionar todos los 
//moviles de cada web (segun su id_parent_usuario y su nivel de usuario)
app.post("/usuario", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      return client.query(`SELECT U.us_id_usuario, U.us_correo, U.us_empresa, U.us_telefono, 
      U.us_pais, U.us_id_parent_usuario, U.us_latitud, U.us_longitud, 
      U.us_direccion, U.us_nombre, U.us_apellidos, U.us_tipo_usuario, 
      U.us_fecha_hora, U.us_password, U.us_borrar, U.niv_id_nivel_usuario, N.niv_nivel
      FROM usuario U
      inner join nivel_usuario N 
      on U.niv_id_nivel_usuario = N.niv_id_niveluser
      where (U.us_id_parent_usuario = '${req.body.us_id_parent_usuario}' 
      and N.niv_id_niveluser = '${req.body.niv_id_niveluser}') 
      and us_borrar='0' limit 30;`);
    })
    .then(results => {
      if(results.rowCount!=0){
          console.log("results?", results.rows);
          res.status(200).send(results.rows);
      }else{
          res
          .status(200)
          .send({ message: "no posee ningun usuario registrado", error: "0" });
      }
  })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({ message: "Error 404" });
    });
});

//agregar usuario
app.post("/usuario/add", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //verficar si existe usuario
      return client.query(
        `SELECT U.us_id_usuario, U.us_correo, U.us_empresa, U.us_telefono, 
        U.us_pais, U.us_id_parent_usuario, U.us_latitud, U.us_longitud, 
        U.us_direccion, U.us_nombre, U.us_apellidos, U.us_tipo_usuario, 
        U.us_fecha_hora, U.us_password, U.us_borrar, U.niv_id_nivel_usuario, N.niv_nivel
        FROM usuario U
        inner join nivel_usuario N 
        on U.niv_id_nivel_usuario = N.niv_id_niveluser
        where 
        U.us_id_parent_usuario = '${req.body.us_id_parent_usuario}' 
        and N.niv_id_niveluser = '${req.body.niv_id_nivel_usuario}'
        and us_borrar='0' and (U.us_empresa = '${req.body.us_empresa}' or U.us_correo = '${req.body.us_correo}') `
      );
    })
    .then(results => {
      //sino existe debe registrar
      if (results.rowCount == 0) {
        const client = new Client();
        client
          .connect()
          .then(() => {
              const sql = `INSERT INTO usuario(
              us_correo, us_empresa, us_telefono, us_pais, us_id_parent_usuario, 
              us_latitud, us_longitud, us_direccion, us_nombre, us_apellidos, 
              us_tipo_usuario, us_fecha_hora, us_password, niv_id_nivel_usuario, us_borrar)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'null', $11, $12, $13, '0')`
              
            const params = [
              req.body.us_correo,
              req.body.us_empresa,
              req.body.us_telefono,
              req.body.us_pais,
              req.body.us_id_parent_usuario,
              req.body.us_latitud,
              req.body.us_longitud,
              req.body.us_direccion,
              req.body.us_nombre,
              req.body.us_apellidos,
              req.body.us_fecha_hora,
              req.body.us_password,
              req.body.niv_id_nivel_usuario
            ];

            return client.query(sql, params);
          })
          .then(result => {
            res.status(200).send({ message: "registro exitoso", error: "0" });
          })
          .catch(err => {
            console.log("err", err);
            res.status(404).send({
              message: "ha ocurrido un error un su peticion",
              error: "1"
            });
          });
      } else {
        res.status(200).send({
          message:
            "ya existe un usuario con dicho correo u empresa",
          error: "0"
        });
      }
    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({
        message: "ha ocurrido un error un su peticion",
        error: "1"
      });
    });
});


//editar usuario
app.post("/usuario/edit", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //verficar si existe usuario
      return client.query(
        `SELECT U.us_id_usuario, U.us_correo, U.us_empresa, U.us_telefono, 
        U.us_pais, U.us_id_parent_usuario, U.us_latitud, U.us_longitud, 
        U.us_direccion, U.us_nombre, U.us_apellidos, U.us_tipo_usuario, 
        U.us_fecha_hora, U.us_password, U.us_borrar, U.niv_id_nivel_usuario, N.niv_nivel
        FROM usuario U
        inner join nivel_usuario N 
        on U.niv_id_nivel_usuario = N.niv_id_niveluser
        where 
        U.us_id_parent_usuario = '${req.body.us_id_parent_usuario}' 
        and N.niv_id_niveluser = '${req.body.niv_id_nivel_usuario}'
        and us_borrar='0' and (U.us_empresa = '${req.body.us_empresa}' or U.us_correo = '${req.body.us_correo}') `
      );
    })
    .then(results => {
      //sino existe debe registrar
      if (results.rowCount == 0) {
        const client = new Client();
        client
          .connect()
          .then(() => {
              const sql = `UPDATE usuario
              SET us_correo= $1, us_empresa= $2, us_telefono= $3, 
                us_pais= $4, us_id_parent_usuario= $5, us_latitud= $6, us_longitud= $7, 
                us_direccion= $8, us_nombre= $9, us_apellidos= $10, us_fecha_hora= $11, 
                us_password=$12, niv_id_nivel_usuario=$13 WHERE us_id_usuario = $14;`
              
            const params = [
              req.body.us_correo,
              req.body.us_empresa,
              req.body.us_telefono,
              req.body.us_pais,
              req.body.us_id_parent_usuario,
              req.body.us_latitud,
              req.body.us_longitud,
              req.body.us_direccion,
              req.body.us_nombre,
              req.body.us_apellidos,
              req.body.us_fecha_hora,
              req.body.us_password,
              req.body.niv_id_nivel_usuario,
              req.body.us_id_usuario
            ];

            return client.query(sql, params);
          })
          .then(result => {
            res.status(200).send({ message: "modificado exitoso", error: "0" });
          })
          .catch(err => {
            console.log("err", err);
            res.status(404).send({
              message: "ha ocurrido un error un su peticion",
              error: "1"
            });
          });
      } else {
        res.status(200).send({
          message:
            "ya existe un usuario con dicho correo u empresa",
          error: "0"
        });
      }
    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({
        message: "ha ocurrido un error un su peticion",
        error: "1"
      });
    });
});


//eliminar usuario
app.post("/usuario/delete", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      const sql = `UPDATE usuario SET us_borrar ='1' WHERE us_id_usuario = $1`
      const params = [req.body.us_id_usuario];
      return client.query(sql, params);
    })
    .then(results => {
      console.log("delete results", results);
      res.status(200).send({ message: "Informacion eliminada" });
    })
    .catch(err => {
      console.log("err", err);
      res.status(404).send({ message: "Error 404" });
    });
});

// usuario like
app.post("/usuario/like", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      return client.query(`SELECT U.us_id_usuario, U.us_correo, U.us_empresa, U.us_telefono, 
      U.us_pais, U.us_id_parent_usuario, U.us_latitud, U.us_longitud, 
      U.us_direccion, U.us_nombre, U.us_apellidos, U.us_tipo_usuario, 
      U.us_fecha_hora, U.us_password, U.us_borrar, U.niv_id_nivel_usuario, N.niv_nivel
      FROM usuario U
      inner join nivel_usuario N 
      on U.niv_id_nivel_usuario = N.niv_id_niveluser
      where (U.us_id_parent_usuario = '${req.body.us_id_parent_usuario}' 
      and N.niv_id_niveluser = '${req.body.niv_id_niveluser}') 
      and us_borrar='0' and U.us_correo LIKE '${req.body.search}%' limit 20;`);
    })
    .then(results => {

      if(results.rowCount!=0){
          console.log("results?", results.rows);
          res.status(200).send(results.rows);
      }else{
          res
          .status(200)
          .send({ message: "no posee ningun usuario registrado", error: "0" });
      }
    
  })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({ message: "Error 404" });
    });
});

/****************************** TABLA ARTEFACTO ******************************/
//consultar artefactos de la zona del usuario
app.post("/artefacto", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      return client.query(`SELECT A.art_id_artefacto, A.art_artefacto, A.art_orden, 
      A.art_borrar, Z.zo_id_zona, Z.zo_zona, Z.us_id_usuario, 
      U.us_nombre, U.us_apellidos FROM artefacto A
        inner join zona Z
        on Z.zo_id_zona = A.zo_id_zona 
        inner join usuario U
        on Z.us_id_usuario = U.us_id_usuario 
        where 
        Z.us_id_usuario ='${req.body.us_id_usuario}' and 
        A.art_borrar = '0' and 
        Z.zo_id_zona = '${req.body.zo_id_zona}' and
        Z.zo_borrar = '0'
        order by A.art_artefacto asc
      `);
    })
    .then(result => {
      if (result.rowCount != 0) res.send(result.rows);
      //res.status(200).send(results.rows);
      else {
        res.status(200).send({
          message: "no posee ningun artefacto registrado",
          error: "0"
        });
      }
    })
    .catch(err => {
      res.status(404).send({
        message:
          "ha ocurrido un error un su peticion, al tratar de consultar los artefactos",
        error: "1"
      });
    });
});

//registrar usuario
app.post("/artefacto/add", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //verficar si existe modulo
      return client.query(
        `SELECT A.art_id_artefacto, A.art_artefacto, A.art_orden, 
        A.zo_id_zona, A.art_borrar, Z.zo_id_zona, Z.zo_zona, Z.us_id_usuario, U.us_nombre, U.us_apellidos
          FROM artefacto A
          inner join zona Z
          on Z.zo_id_zona = A.zo_id_zona 
          inner join usuario U
          on Z.us_id_usuario = U.us_id_usuario 
          where 
          Z.us_id_usuario = '${req.body.us_id_usuario}' and 
          A.art_borrar = '0' and 
          Z.zo_id_zona = '${req.body.zo_id_zona}' and 
          Z.zo_borrar = '0' and 
          A.art_artefacto= '${req.body.art_artefacto}'`
      );
    })
    .then(results => {
      //sino existe debe registrar
      if (results.rowCount == 0) {
        const client = new Client();
        client
          .connect()
          .then(() => {
            const sql = `INSERT INTO artefacto(
              art_artefacto, art_orden, zo_id_zona, art_borrar)
              VALUES ($1, $2, $3, 0)`;
            const params = [
              req.body.art_artefacto,
              req.body.art_orden,
              req.body.zo_id_zona
            ];

            return client.query(sql, params);
          })
          .then(result => {
            res.status(200).send({ message: "registro exitoso", error: "0" });
          })
          .catch(err => {
            console.log("err", err);
            res.status(404).send({
              message: "ha ocurrido un error un su peticion",
              error: "1"
            });
          });
      } else {
        res.status(200).send({
          message: "ya existe un artefacto con ese nombre",
          error: "0"
        });
      }
    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({
        message: "ha ocurrido un error un su peticion",
        error: "1"
      });
    });
});

//eliminar artefacto
app.post("/artefacto/delete", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      const sql = `UPDATE artefacto SET art_borrar='1' WHERE art_id_artefacto= $1`;
      const params = [req.body.art_id_artefacto];
      return client.query(sql, params);
    })
    .then(results => {
      // console.log("delete results", results);
      res.status(200).send({ message: "Informacion eliminada" });
    })
    .catch(err => {
      // console.log("err", err);
      res.status(404).send({ message: "Error 404" });
    });
});

//modificar artefacto
app.post("/artefacto/edit", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //verficar si existe artefacto
      return client.query(
        `SELECT A.art_id_artefacto, A.art_artefacto, A.art_orden, 
        A.zo_id_zona, A.art_borrar, Z.zo_id_zona, Z.zo_zona, Z.us_id_usuario, U.us_nombre, U.us_apellidos
          FROM artefacto A
          inner join zona Z
          on Z.zo_id_zona = A.zo_id_zona 
          inner join usuario U
          on Z.us_id_usuario = U.us_id_usuario 
          where 
          Z.us_id_usuario = '${req.body.us_id_usuario}' and 
          A.art_borrar = '0' and 
          Z.zo_id_zona = '${req.body.zo_id_zona}' and 
          Z.zo_borrar = '0' and 
          A.art_artefacto= '${req.body.art_artefacto}'`
      );
    })
    .then(results => {
      //sino existe debe registrar
      if (results.rowCount == 0) {
        const client = new Client();
        client
          .connect()
          .then(() => {
            console.log(`UPDATE artefacto SET 
            art_artefacto='${req.body.art_artefacto}' 
            WHERE 
            art_id_artefacto = '${req.body.art_id_artefacto}'`);

            const sql = `UPDATE artefacto SET 
            art_artefacto='${req.body.art_artefacto}' 
            WHERE 
            art_id_artefacto = '${req.body.art_id_artefacto}'`;
            return client.query(sql);
          })
          .then(result => {
            res
              .status(200)
              .send({ message: "modificado con exitoso", error: "0" });
          })
          .catch(err => {
            console.log("err", err);
            res.status(404).send({
              message: "ha ocurrido un error un su peticion",
              error: "1"
            });
          });
      } else {
        res.status(200).send({
          message: "ya existe un artefacto con ese nombre",
          error: "0"
        });
      }
    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({
        message: "ha ocurrido un error un su peticion",
        error: "1"
      });
    });
});

//like artefacto
app.post("/artefacto/like", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      const sql = `SELECT A.art_id_artefacto, A.art_artefacto, A.art_orden, 
                  A.zo_id_zona, A.art_borrar, Z.zo_id_zona, Z.zo_zona, Z.us_id_usuario, U.us_nombre, U.us_apellidos
                    FROM artefacto A
                    inner join zona Z
                    on Z.zo_id_zona = A.zo_id_zona 
                    inner join usuario U
                    on Z.us_id_usuario = U.us_id_usuario 
                    where 
                    Z.us_id_usuario = '${req.body.us_id_usuario}' and
                     A.art_borrar = '0' and 
                     A.art_artefacto like '${req.body.search}%' and
                     Z.zo_borrar = '0' 
                     order by A.art_artefacto asc limit 5`;

      return client.query(sql);
    })
    .then(results => {
      //si consiguio envia
      if (results.rowCount != 0) res.status(200).send(results.rows);
      else res.status(200).send({ message: "nada" }); //sino consiguio envia envia un msj diciendo nada
    })
    .catch(err => {
      res.status(404).send({
        message: "ha ocurrido un error un su peticion de busqueda",
        error: "1"
      });
    });
});

/****************************** TABLA DATOS_SERVIDOR ******************************/
//ver todos los servidores
app.get("/servidor", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //falta modificar queary
      const sql = `SELECT 
      DS.ser_id_servidor, DS.ser_servidor, DS.ser_user, DS.ser_password, 
      DS.ser_port, DS.ser_ssl_port, DS.ser_wa_port, DS.ser_connection_limit, 
      DS.us_id_usuario, DS.data_id, DS.plan_id, DS.ser_name, DS.ser_borrar, 
      U.us_correo, P.plan_name, D.data_name 
      FROM datos_servidor DS 
      inner join usuario U
      on U.us_id_usuario = DS.us_id_usuario 
      inner join datacenter D
      on D.data_id = DS.data_id
      inner join plan_servidor P
      on P.plan_id = DS.plan_id
      where 
      DS.ser_borrar='0' and 
      D.data_borrar='0' and 
      P.plan_borrar='0' `;
      console.log(sql)
    return client.query(sql)
    })
    .then(results => {
        if (results.rowCount != 0) res.send(results.rows);
        else {
          res.status(200).send({
            message: "no existe ningun servidor registrado",
            error: "0"
          })
        }
      })
      .catch(err => {
        console.log("error", err);
        res.status(404).send({
          message:
            "ha ocurrido un error en su peticion al tratar de consultar los servidores",
          error: "1"
        })
      })
})

//like servidor
app.post("/servidor/like", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        const sql = `SELECT 
        DS.ser_id_servidor, DS.ser_servidor, DS.ser_user, DS.ser_password, 
        DS.ser_port, DS.ser_ssl_port, DS.ser_wa_port, DS.ser_connection_limit, 
        DS.us_id_usuario, DS.data_id, DS.plan_id, DS.ser_name, DS.ser_borrar, 
        U.us_correo, P.plan_name, D.data_name 
        FROM datos_servidor DS 
        inner join usuario U
        on U.us_id_usuario = DS.us_id_usuario 
        inner join datacenter D
        on D.data_id = DS.data_id
        inner join plan_servidor P
        on P.plan_id = DS.plan_id
        where 
        DS.ser_borrar='0' and 
        D.data_borrar='0' and 
        P.plan_borrar='0' 
        and DS.ser_servidor LIKE '${req.body.ser_servidor}%' `
        return client.query(sql)
      })
      .then(results => {
        if (results.rowCount != 0) 
          res.status(200).send(results.rows);
        else res.status(200).send(
          { message: "No se han encontrado los datos solicitados" }
        )
      })
      .catch(err => {
        console.log(err)
        res.status(404).send({
          message: "ha ocurrido un error un su peticion de busqueda",
          error: "1"
        })
      })
  })

//registrar servidor
app.post("/servidor/add", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //verficar si existe servidor
      return client.query(        
        `SELECT
        DS.ser_id_servidor, DS.ser_servidor, DS.ser_user, DS.ser_password, 
        DS.ser_port, DS.ser_ssl_port, DS.ser_wa_port, DS.ser_connection_limit, 
        DS.us_id_usuario, DS.data_id, DS.plan_id, DS.ser_name, DS.ser_borrar, 
        U.us_correo, P.plan_name, D.data_name 
        FROM datos_servidor DS 
        inner join usuario U
        on U.us_id_usuario = DS.us_id_usuario 
        inner join datacenter D
        on D.data_id = DS.data_id
        inner join plan_servidor P
        on P.plan_id = DS.plan_id
        where 
        DS.ser_borrar='0' and 
        D.data_borrar='0' and 
        P.plan_borrar='0' and  (ser_servidor = '${
          req.body.ser_servidor}')`
      )
    })
    .then(results => {
      //sino existe debe registrar servidor
      if (results.rowCount == 0) {
        const client = new Client();
        client
          .connect()
          .then(() => {
            const sql =`INSERT INTO datos_servidor (ser_servidor, ser_user, ser_password, ser_port,
                ser_ssl_port, ser_wa_port, ser_connection_limit, us_id_usuario, data_id, 
                plan_id, ser_name, ser_borrar)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
              const params = [
                req.body.ser_servidor,
                req.body.ser_user,
                req.body.ser_password,
                req.body.ser_port,
                req.body.ser_ssl_port,
                req.body.ser_wa_port,
                req.body.ser_connection_limit,
                req.body.us_id_usuario,
                req.body.data_id, 
                req.body.plan_id, 
                req.body.ser_name, 
                "0"
              ]
              return client.query(sql, params)
          })
          .then(result => {
            res.status(200).send({ message: "registro exitoso", error: "0" })
          })
          .catch(err => {
            console.log("err", err)
            res.status(404).send({
              message:
                "ha ocurrido un error en su peticion al tratar de crear un servidor",
              error: "1"
            })
          })
      } else {
        res
          .status(200)
          .send({ message: "a existe un servidor con ese nombre", error: "0" })
      }
    })
    .catch(err => {
      console.log("error", err)
      res.status(404).send({
        message:
          "ha ocurrido un error en su peticion al tratar de crear un servidor",
        error: "1"
      })
    })
})


//editar servidor
app.post("/servidor/edit", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //verficar si existe servidor
    return client.query(        
      `SELECT
      DS.ser_id_servidor, DS.ser_servidor, DS.ser_user, DS.ser_password, 
      DS.ser_port, DS.ser_ssl_port, DS.ser_wa_port, DS.ser_connection_limit, 
      DS.us_id_usuario, DS.data_id, DS.plan_id, DS.ser_name, DS.ser_borrar, 
      U.us_correo, P.plan_name, D.data_name 
      FROM datos_servidor DS 
      inner join usuario U
      on U.us_id_usuario = DS.us_id_usuario 
      inner join datacenter D
      on D.data_id = DS.data_id
      inner join plan_servidor P
      on P.plan_id = DS.plan_id
      where ser_borrar = '0' and  (ser_servidor = '${
        req.body.ser_servidor}')`
      );
    })
    .then(results => {
      //sino existe debe registrar servidor
      if (results.rowCount == 0) {
          const client = new Client()
          client
            .connect()
            .then(() => {
              const sql = `UPDATE datos_servidor SET 
              ser_servidor = $1, ser_user = $2, ser_password = $3, 
              ser_port = $4, ser_ssl_port = $5, ser_wa_port = $6, ser_connection_limit = $7, 
              us_id_usuario = $8, data_id = $9, plan_id = $10, ser_name = $11 WHERE ser_id_servidor = $12`
            const params = [
              req.body.ser_servidor,
              req.body.ser_user,
              req.body.ser_password,
              req.body.ser_port,
              req.body.ser_ssl_port,
              req.body.ser_wa_port,
              req.body.ser_connection_limit,
              req.body.us_id_usuario,
              req.body.data_id, 
              req.body.plan_id, 
              req.body.ser_name, 
              req.body.ser_id_servidor
            ]
            return client.query(sql, params)
            })
            .then(result => {
              res
                .status(200)
                .send({ message: "Modificado con exitoso", error: "0" })
            })
            .catch(err => {
              console.log("err", err)
              res.status(404).send({
                message:
                  "Ha ocurrido un error en su peticion al tratar de modificar el servidor",
                error: "1"
              });
            });
        } else {
          res
            .status(200)
            .send({ message: "Ya existe un servidor con ese nombre", error: "0" })
        }
      })
      .catch(err => {
        console.log("error", err)
        res.status(404).send({
          message:
            "Ha ocurrido un error en su peticion al tratar de modificar el servidor",
          error: "1"
        })
      })
  })


//eliminar servidor
app.post("/servidor/delete", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      const sql = "UPDATE datos_servidor SET ser_borrar='1' WHERE ser_id_servidor = $1"
      const params = [req.body.ser_id_servidor]
      return client.query(sql, params);
    })
    .then(results => {
        res
          .status(200)
          .send({ message: "Servidor eliminado con exito", error: "0" })
      })
      .catch(err => {
        res.status(404).send({
          message:
            "ha ocurrido un error en su peticion al tratar eliminar un servidor",
          error: "1"
        })
      })
  })


/****************************** TABLA MODULO ******************************/
//ver todos los modulos
app.get("/modulo", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      return client.query(
        `SELECT mo_id_modulo, mo_nombre_modulo, mo_orden, mo_tipo_dato,
         mo_proceso, mo_read_write, mo_borrar FROM modulo 
         where mo_borrar = '0' order by mo_orden asc`
      );
    })
    .then(results => {
        if(results.rowCount!=0){
            console.log("results?", results.rows);
            res.status(200).send(results.rows);
        }else{
            res
            .status(200)
            .send({ message: "no posee ninguna zona registrada", error: "0" });
        }
      
    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({
        message:
          "ha ocurrido un error un su peticion, al tratar de crear un modulo",
        error: "1"
      });
    });
});

//registrar modulo
app.post("/modulo/add", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //verficar si existe modulo
      return client.query(
        `SELECT 
        mo_id_modulo, mo_nombre_modulo, mo_orden, mo_tipo_dato, 
        mo_proceso, mo_read_write, mo_borrar 
        FROM modulo where mo_borrar = 0 and  mo_nombre_modulo = '${
          req.body.mo_nombre_modulo
        }' order by mo_orden desc`
      );
    })
    .then(results => {
      //sino existe debe registrar modulo
      if (results.rowCount == 0) {
        const client = new Client();
        client
          .connect()
          .then(() => {
            const sql = `INSERT INTO modulo (mo_nombre_modulo, mo_orden, mo_tipo_dato,
                 mo_proceso, mo_read_write, mo_borrar)
                 VALUES ($1, $2, $3, $4, $5, $6)`;
            const params = [
              req.body.mo_nombre_modulo,
              req.body.mo_orden,
              req.body.mo_tipo_dato,
              req.body.mo_proceso,
              req.body.mo_read_write,
              "0"
            ];
            return client.query(sql, params);
          })
          .then(result => {
            console.log("result?", result);
            res.status(200).send({ message: "registro exitoso", error: "0" });
          })
          .catch(err => {
            console.log("err", err);
            res.status(404).send({
              message:
                "ha ocurrido un error un su peticion, al tratar de crear un modulo",
              error: "1"
            });
          });
      } else {
        res
          .status(200)
          .send({ message: "ya existe un modulo con ese nombre", error: "0" });
      }
    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({
        message:
          "ha ocurrido un error un su peticion, al tratar de crear un modulo",
        error: "1"
      });
    });
});

//eliminar modulo
app.post("/modulo/delete", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      const sql = "DELETE FROM modulo WHERE mo_id_modulo = $1";
      const params = [req.body.mo_id_modulo];
      return client.query(sql, params);
    })
    .then(results => {
      res
        .status(200)
        .send({ message: "modulo eliminado con exito", error: "0" });
    })
    .catch(err => {
      res.status(404).send({
        message:
          "ha ocurrido un error un su peticion, al tratar eliminar un modulo",
        error: "1"
      });
    });
});

//editar modulo
app.post("/modulo/edit", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //verficar si existe modulo
      return client.query(
        `SELECT 
        mo_id_modulo, mo_nombre_modulo, mo_orden, mo_tipo_dato, 
        mo_proceso, mo_read_write, mo_borrar 
        FROM modulo where mo_borrar = 0 and  mo_nombre_modulo = '${
          req.body.mo_nombre_modulo
        }' order by mo_orden desc`
      );
    })
    .then(results => {
      //sino existe debe modica modulo
      if (results.rowCount == 0) {
        const client = new Client();
        client
          .connect()
          .then(() => {
            const sql = `UPDATE modulo SET
             mo_nombre_modulo = '${req.body.mo_nombre_modulo}', mo_orden = '${
              req.body.mo_orden
            }', 
         mo_tipo_dato = '${req.body.mo_tipo_dato}', mo_proceso = '${
              req.body.mo_proceso
            }',
          mo_read_write = '${req.body.mo_read_write}' WHERE mo_id_modulo = '${
              req.body.mo_id_modulo
            }' `;

            return client.query(sql);
          })
          .then(result => {
            res
              .status(200)
              .send({ message: "modificado con exitoso", error: "0" });
          })
          .catch(err => {
            console.log("err", err);
            res.status(404).send({
              message:
                "ha ocurrido un error un su peticion, al tratar de modificar el modulo",
              error: "1"
            });
          });
      } else {
        res
          .status(200)
          .send({ message: "ya existe un modulo con ese nombre", error: "0" });
      }
    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({
        message:
          "ha ocurrido un error un su peticion, al tratar de crear un modulo",
        error: "1"
      });
    });
});

//buscar like  modulo
app.post("/modulo/like", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      const sql = `SELECT mo_id_modulo, mo_nombre_modulo, mo_orden, 
      mo_tipo_dato, mo_proceso, mo_read_write,mo_borrar
      FROM modulo 
      where mo_borrar ='0' and 
      mo_nombre_modulo LIKE '${req.body.search}%' limit 5`;

      return client.query(sql);
    })
    .then(results => {
      //si consiguio envia
      if (results.rowCount != 0) res.status(200).send(results.rows);
      else res.status(200).send({ message: "nada" }); //sino consiguio envia envia un msj diciendo nada
    })
    .catch(err => {
      res.status(404).send({
        message: "ha ocurrido un error un su peticion de busqueda de modulos",
        error: "1"
      });
    });
});

/****************************** TABLA NIVEL USUARIO ******************************/
//ver todos los niveles de usuario
app.get("/nivel", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      return client.query(
        `SELECT niv_id_niveluser, niv_nivel, niv_orden,niv_borrar 
            FROM nivel_usuario where niv_borrar='0'
            order by niv_orden desc`
      );
    })
    .then(results => {
        console.log("results?", results);
        if(results.rowCount!=0){
            res.status(200).send(results.rows);
        }else{
            res
            .status(200)
            .send({ message: "no posee ningun nivel de usuario registrado", error: "0" });
        }

    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({ message: "Error 404" });
    });
});

//insertar nivel de usuario
app.post("/nivel/add", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        //verficar si existe nivel
        return client.query(
            `SELECT niv_id_niveluser, niv_nivel, niv_orden, niv_borrar FROM nivel_usuario 
            where (niv_id_niveluser = '-1' or niv_nivel = '${req.body.niv_nivel}') and niv_borrar = '0'`
        );
      })
      .then(results => {
        //sino existe debe registrar modulo
        if (results.rowCount == 0) {
          const client = new Client();
          client
            .connect()
            .then(() => {
              return client.query(`INSERT INTO nivel_usuario(niv_nivel, niv_orden, niv_borrar)
              VALUES ('${req.body.niv_nivel}', ${req.body.niv_orden}, '0')`);
            })
            .then(result => {
             // console.log("result?", result);
              res.status(200).send({ message: "registro exitoso", error: "0" });
            })
            .catch(err => {
             // console.log("err", err);
              res.status(404).send({
                message:
                  "ha ocurrido un error un su peticion, al tratar de crear un modulo",
                error: "1"
              });
            });
        } else {
          res
            .status(200)
            .send({ message: "ya existe un nivel con ese nombre", error: "0" });
        }
      })
      .catch(err => {
        console.log("error", err);
        res.status(404).send({
          message:
            "ha ocurrido un error un su peticion, al tratar de crear un nivel de usuario",
          error: "1"
        });
      });
  });



//eliminar nivel de usuario
app.post("/nivel/delete", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        const sql = "DELETE FROM nivel_usuario WHERE niv_id_niveluser = $1";
        const params = [req.body.niv_id_niveluser];
        return client.query(sql, params);
      })
      .then(results => {
        res
          .status(200)
          .send({ message: "nivel de usuario eliminado con exito", error: "0" });
      })
      .catch(err => {
        res.status(404).send({
          message:
            "ha ocurrido un error un su peticion, al tratar eliminar el nivel de usuario",
          error: "1"
        });
      });
  });

//editar nivel de usuario
app.post("/nivel/edit", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        //verficar si existe nivel
        return client.query(
            `SELECT niv_id_niveluser, niv_nivel, niv_orden, niv_borrar FROM nivel_usuario 
            where (niv_id_niveluser = '-1' or niv_nivel = '${req.body.niv_nivel}') and niv_borrar = '0'`
        );
      })
      .then(results => {
        //sino existe debe registrar modulo
        if (results.rowCount == 0) {
          const client = new Client();
          client
            .connect()
            .then(() => {
                return client.query(`UPDATE nivel_usuario
                SET niv_nivel = '${req.body.niv_nivel}', niv_orden = '${req.body.niv_orden}'
                WHERE niv_id_niveluser = '${req.body.niv_id_niveluser}'`);
            })
            .then(result => {
             // console.log("result?", result);
              res.status(200).send({ message: "modificado con exitoso", error: "0" });
            })
            .catch(err => {
             // console.log("err", err);
              res.status(404).send({
                message:
                  "ha ocurrido un error un su peticion, al tratar de modificar el nivel de usuario",
                error: "1"
              });
            });
        } else {
          res
            .status(200)
            .send({ message: "ya existe un nivel con ese nombre", error: "0" });
        }
      })
      .catch(err => {
        console.log("error", err);
        res.status(404).send({
          message:
            "ha ocurrido un error un su peticion, al tratar de crear un nivel de usuario",
          error: "1"
        });
      });
  });

//like nivel de usuario
app.post("/nivel/like", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        const sql = `SELECT niv_id_niveluser, niv_nivel, niv_orden, niv_borrar
        FROM nivel_usuario 
        where niv_borrar='0' and 
        niv_nivel LIKE '${req.body.search}%' limit 5`;
        return client.query(sql);
      })
      .then(results => {
        //si consiguio envia
        if (results.rowCount != 0) res.status(200).send(results.rows);
        else res.status(200).send({ message: "nada" }); //sino consiguio envia envia un msj diciendo nada
      })
      .catch(err => {
        res.status(404).send({
          message: "ha ocurrido un error un su peticion de busqueda de modulos",
          error: "1"
        });
      });
  });

/****************************** TABLA ZONA ******************************/
//consultar zona
app.post("/zona", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      const sql = `SELECT Z.zo_id_zona, Z.zo_zona, Z.zo_orden, Z.us_id_usuario, Z.zo_borrar
                  FROM zona Z
                  inner join usuario U
                  on Z.us_id_usuario = U.us_id_usuario 
                  where Z.zo_borrar = '0' and U.us_id_usuario = '${
                    req.body.us_id_usuario
                  }'`;
      return client.query(sql);
    })
    .then(result => {
      if (result.rowCount != 0) res.send(result.rows);
      else {
        res
          .status(200)
          .send({ message: "no posee ninguna zona registrada", error: "0" });
      }
      // res.status(200).send(results.rows);
    })
    .catch(err => {
      console.log("err", err);
      res.status(404).send({
        message:
          "ha ocurrido un error un su peticion, al tratar de consultar las zonas",
        error: "1"
      });
    });
});

//registrar zona
app.post("/zona/add", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //verficar si existe modulo
      return client.query(
        `SELECT Z.zo_id_zona, Z.zo_zona, Z.zo_orden, Z.us_id_usuario, Z.zo_borrar
        FROM zona Z
        inner join usuario U
        on Z.us_id_usuario = U.us_id_usuario 
        where Z.zo_borrar = '0' and Z.zo_zona = '${
          req.body.zo_zona
        }' and U.us_id_usuario = '${req.body.us_id_usuario}'`
      );
    })
    .then(results => {
      //sino existe debe registrar
      if (results.rowCount == 0) {
        const client = new Client();
        client
          .connect()
          .then(() => {
            const sql = `INSERT INTO zona(
                  zo_zona, zo_orden, us_id_usuario, zo_borrar)
                  VALUES ($1, $2, $3, $4)`;
            const params = [
              req.body.zo_zona,
              req.body.zo_orden,
              req.body.us_id_usuario,
              "0"
            ];
            return client.query(sql, params);
          })
          .then(result => {
            console.log("result?", result);
            res.status(200).send({ message: "registro exitoso", error: "0" });
          })
          .catch(err => {
            console.log("err", err);
            res.status(404).send({
              message: "ha ocurrido un error un su peticion",
              error: "1"
            });
          });
      } else {
        res
          .status(200)
          .send({ message: "ya existe una zona con ese nombre", error: "0" });
      }
    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({
        message: "ha ocurrido un error un su peticion",
        error: "1"
      });
    });
});

//eliminar zona
app.post("/zona/delete", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      const sql = "UPDATE zona set zo_borrar = '1' WHERE zo_id_zona = $1";
      const params = [req.body.zo_id_zona];
      return client.query(sql, params);
    })
    .then(results => {
      // console.log("delete results", results);
      res.status(200).send({ message: "Informacion eliminada" });
    })
    .catch(err => {
      // console.log("err", err);
      res.status(404).send({ message: "Error 404" });
    });
});

//editar zona
app.post("/zona/edit", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      //verficar si existe zona
      return client.query(
        `SELECT Z.zo_id_zona, Z.zo_zona, Z.zo_orden, Z.us_id_usuario, Z.zo_borrar
        FROM zona Z
        inner join usuario U
        on Z.us_id_usuario = U.us_id_usuario 
        where Z.zo_borrar = '0' and Z.zo_zona = '${
          req.body.zo_zona
        }' and U.us_id_usuario = '${req.body.us_id_usuario}'`
      );
    })
    .then(results => {
      //sino existe debe modicar
      if (results.rowCount == 0) {
        const client = new Client();
        client
          .connect()
          .then(() => {
            const sql = `UPDATE zona SET zo_zona = '${
              req.body.zo_zona
            }' WHERE zo_id_zona = '${req.body.zo_id_zona}'`;

            return client.query(sql);
          })
          .then(result => {
            res
              .status(200)
              .send({ message: "modificado con exitoso", error: "0" });
          })
          .catch(err => {
            console.log("err", err);
            res.status(404).send({
              message: "ha ocurrido un error un su peticion",
              error: "1"
            });
          });
      } else {
        res
          .status(200)
          .send({ message: "ya existe una zona con ese nombre", error: "0" });
      }
    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({
        message: "ha ocurrido un error un su peticion",
        error: "1"
      });
    });
});

//buscar like  zona
app.post("/zona/like", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      const sql = `SELECT Z.zo_id_zona, Z.zo_zona, Z.zo_orden, Z.us_id_usuario, Z.zo_borrar
                  FROM zona Z
                  inner join usuario U
                  on Z.us_id_usuario = U.us_id_usuario 
                  where Z.zo_borrar = '0' and 
                  U.us_id_usuario = '${req.body.us_id_usuario}' and 
                  Z.zo_zona LIKE '${req.body.search}%' limit 5`;

      return client.query(sql);
    })
    .then(results => {
      //si consiguio envia
      if (results.rowCount != 0) res.status(200).send(results.rows);
      else res.status(200).send({ message: "nada" }); //sino consiguio envia envia un msj diciendo nada
    })
    .catch(err => {
      res.status(404).send({
        message: "ha ocurrido un error un su peticion de busqueda",
        error: "1"
      });
    });
});

/****************************** TABLA PAGO ******************************/
//_________Recibir todos los datos de la Tabla PAGO______________
app.get("/pago", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      return client.query(`SELECT pag_id_pago, pag_fecha_hora_inicio, pag_fecha_hora_final, pag_monto, 
        u.us_nombre, u.us_apellidos, u.us_empresa, n.niv_nivel
        FROM pago AS p
        INNER JOIN usuario AS u
            ON p.us_id_usuario = u.us_id_usuario
        INNER JOIN nivel_usuario AS n
            ON u.niv_id_nivel_usuario = n.niv_id_niveluser
        ORDER BY pag_id_pago, pag_fecha_hora_inicio, pag_fecha_hora_final, pag_monto, u.us_nombre, 
        u.us_apellidos, u.us_empresa, n.niv_nivel`);
    })
    .then(results => {
      console.log("results?", results);
      res.status(200).send(results);
    })
    .catch(err => {
      console.log("error", err);
      res.status(404).send({ message: "Error 404" });
    });
});

//________Enviar informacion a la Tabla PAGO___________
app.post("/pago/add", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      res.status(200).send({ message: "Informacion enviada" });
      const sql =
        "INSERT INTO pago (us_id_usuario, us_id_parent_usuario, pag_fecha_hora_inicio, pag_fecha_hora_final, pag_monto) VALUES ($1, $2, $3, $4, $5)";
      const params = [
        req.body.us_id_usuario,
        req.body.us_id_parent_usuario,
        req.body.pag_fecha_hora_inicio,
        req.body.pag_fecha_hora_final,
        req.body.pag_monto
      ];
      return client.query(sql, params);
    })
    .then(result => {
      console.log("result?", result);
      res.send(result);
    })
    .catch(err => {
      console.log("err", err);
      res.status(404).send({ message: "Error 404" });
    });
});

//________Eliminar informacion de la Tabla PAGO____________
app.post("/pago/delete", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      res.status(200).send({ message: "Informacion eliminada" });
      const sql = "DELETE FROM pago WHERE pag_id_pago = $1";
      const params = [req.body.pag_id_pago];
      return client.query(sql, params);
    })
    .then(results => {
      console.log("delete results", results);
      res.send(results);
    })
    .catch(err => {
      console.log("err", err);
      res.status(404).send({ message: "Error 404" });
    });
});

//_____ Enviar informacion a la Tabla PAGO para ser actualizada
app.post("/pago/edit", (req, res) => {
  const client = new Client();
  client
    .connect()
    .then(() => {
      res.status(200).send({ message: "Informacion actualizada" });
      const sql =
        "UPDATE pago SET us_id_usuario = $1, us_id_parent_usuario = $2, pag_fecha_hora_inicio = $3, pag_fecha_hora_final = $4, pag_monto = $5 WHERE pag_id_pago = $6";
      const params = [
        req.body.us_id_usuario,
        req.body.us_id_parent_usuario,
        req.body.pag_fecha_hora_inicio,
        req.body.pag_fecha_hora_final,
        req.body.pag_monto,
        req.body.pag_id_pago
      ];
      return client.query(sql, params);
    })
    .then(results => {
      console.log("Update results", results);
      res.send(results);
    })
    .catch(err => {
      console.log("err", err);
      res.status(404).send({ message: "Error 404" });
    });
});

/****************************** TABLA DATA_CENTER ******************************/
//ver todos los datos de data center
  app.get("/data", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        return client.query(
          `SELECT data_id, data_orden, data_name, data_borrar 
          FROM datacenter where data_borrar = '0' order by data_orden desc;`);
      })
      .then(results => {
          if(results.rowCount!=0){
              res
              .status(200)
              .send(results.rows);
          }else{
              res
              .status(200)
              .send({ message: "no posee ningun data center registrado", error: "0" });
          }
        
      })
      .catch(err => {
        console.log("error", err);
        res.status(404).send({
          message:
            "ha ocurrido un error un su peticion, al tratar de consultar la data de los servidores",
          error: "1"
        });
      });
  });

  //agregar data
  app.post("/data/add", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        //verficar si existe DATA_CENTER
        return client.query(
          `SELECT data_id, data_orden, data_name, data_borrar 
          FROM datacenter 
          where (data_id = '-1' or data_name = '${req.body.data_name}')
          and data_borrar = '0'`);
      })
      .then(results => {
        //sino existe debe registrar
        if (results.rowCount == 0) {
          const client = new Client();
          client
            .connect()
            .then(() => {
              const sql =`INSERT INTO datacenter(
                data_orden, data_name, data_borrar)
                VALUES ($1, $2, $3);`
                const params = [
                  req.body.data_orden,
                  req.body.data_name, 
                  "0"
                ]
                return client.query(sql, params)
            })
            .then(result => {
              console.log("result?", result)
              res.status(200).send({ message: "registro exitoso", error: "0" })
            })
            .catch(err => {
              console.log("err", err)
              res.status(404).send({
                message:
                  "ha ocurrido un error un su peticion al tratar de crear un data center",
                error: "1"
              })
            })
        } else {
          res
            .status(200)
            .send({ message: "ya existe un data center con ese nombre", error: "0" })
        }
      })
      .catch(err => {
        console.log("error", err)
        res.status(404).send({
          message:
            "ha ocurrido un error en su peticion al tratar de crear un data center",
          error: "1"
        })
      })
  })

  //modificar data
  app.post("/data/edit", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        //verficar si existe DATA_CENTER
        return client.query(
          `SELECT data_id, data_orden, data_name, data_borrar 
          FROM datacenter 
          where (data_id = '-1' or data_name = '${req.body.data_name}')
          and data_borrar = '0'`);
      })
      .then(results => {
        //sino existe debe registrar
        if (results.rowCount == 0) {
          const client = new Client();
          client
            .connect()
            .then(() => {
              const sql = `UPDATE datacenter SET 
              data_orden=${req.body.data_orden}, 
              data_name='${req.body.data_name}'
              WHERE data_id= '${req.body.data_id}';`
              console.log(sql)
                return client.query(sql)
            })
            .then(result => {
              console.log("result?", result)
              res.status(200).send({ message: "modificacion exitosa", error: "0" })
            })
            .catch(err => {
              console.log("err", err)
              res.status(404).send({
                message:
                  "ha ocurrido un error un su peticion al tratar de crear un data center",
                error: "1"
              })
            })
        } else {
          res
            .status(200)
            .send({ message: "ya existe un data center con ese nombre", error: "0" })
        }
      })
      .catch(err => {
        console.log("error", err)
        res.status(404).send({
          message:
            "ha ocurrido un error en su peticion al tratar de crear un data center",
          error: "1"
        })
      })
  })
  
  //eliminar data
  app.post("/data/delete", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        const sql =`UPDATE datacenter SET data_borrar = '1' WHERE data_id = $1;`
        const params = [req.body.data_id]
        return client.query(sql, params);
      })
      .then(results => {
          res
            .status(200)
            .send({ message: "Informacion eliminada con exito", error: "0" })
        })
        .catch(err => {
          res.status(404).send({
            message:
              "ha ocurrido un error en su peticion al tratar eliminar un data center",
            error: "1"
          })
        })
    })
    
  //buscaqueda like data
  app.post("/data/like", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        const sql = `SELECT data_id, data_orden, data_name, data_borrar
        FROM datacenter where data_borrar = '0' 
        and data_name LIKE '${req.body.search}%' limit 5`;
        return client.query(sql);
      })
      .then(results => {
        //si consiguio envia
        if (results.rowCount != 0) res.status(200).send(results.rows);
        else res.status(200).send({ message: "nada" }); //sino consiguio envia envia un msj diciendo nada
      })
      .catch(err => {
        res.status(404).send({
          message: "ha ocurrido un error un su peticion de busqueda de data center",
          error: "1"
        });
      });
  });


  /****************************** TABLA PLAN SERVIDOR ******************************/
//ver todos los datos de plan servidor
app.get("/plan", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        return client.query(
          `SELECT plan_id, plan_name, plan_orden, plan_borrar
          FROM plan_servidor where plan_borrar = '0' 
          ORDER BY plan_orden desc;`);
      })
      .then(results => {
          if(results.rowCount!=0){
              res
              .status(200)
              .send(results.rows);
          }else{
              res
              .status(200)
              .send({ message: "no posee ningun data center registrado", error: "0" });
          }
        
      })
      .catch(err => {
        console.log("error", err);
        res.status(404).send({
          message:
            "ha ocurrido un error un su peticion, al tratar de consultar la data de los servidores",
          error: "1"
        });
      });
  });

  //agregar plan
  app.post("/plan/add", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        //verficar si existe plan
        return client.query(
          `SELECT plan_id, plan_name, plan_orden, plan_borrar
          FROM plan_servidor where 
          plan_name = '${req.body.plan_name}' and plan_borrar = '0'`);
      })
      .then(results => {
        //sino existe debe registrar
        if (results.rowCount == 0) {
          const client = new Client();
          client
            .connect()
            .then(() => {
              const sql =`INSERT INTO plan_servidor(plan_name, plan_orden, plan_borrar) 
              VALUES ('${req.body.plan_name}', '${req.body.plan_orden}', '0');`
                return client.query(sql)
            })
            .then(result => {
              res.status(200).send({ message: "registro exitoso", error: "0" })
            })
            .catch(err => {
              console.log("err", err)
              res.status(404).send({
                message:
                  "ha ocurrido un error un su peticion al tratar de crear un plan de servidor",
                error: "1"
              })
            })
        } else {
          res
            .status(200)
            .send({ message: "ya existe un plan de servidor con ese nombre", error: "0" })
        }
      })
      .catch(err => {
        console.log("error", err)
        res.status(404).send({
          message:
            "ha ocurrido un error en su peticion al tratar de crear un plan de servidor",
          error: "1"
        })
      })
  })

  //modificar data
  app.post("/plan/edit", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        //verficar si existe plan
        return client.query(
          `SELECT plan_id, plan_name, plan_orden, plan_borrar
          FROM plan_servidor where 
          plan_name = '${req.body.plan_name}' and plan_borrar = '0'`);
      })
      .then(results => {
        //sino existe debe registrar
        if (results.rowCount == 0) {
          const client = new Client();
          client
            .connect()
            .then(() => {
                const sql = `UPDATE plan_servidor
                SET plan_name= '${req.body.plan_name}', 
                plan_orden='${req.body.plan_orden}'
                WHERE plan_id = '${req.body.plan_id}';`
                return client.query(sql)
            })
            .then(result => {
              res.status(200).send({ message: "modificado con exitoso", error: "0" })
            })
            .catch(err => {
              console.log("err", err)
              res.status(404).send({
                message:
                  "ha ocurrido un error un su peticion al tratar de modificar un plan de servidor",
                error: "1"
              })
            })
        } else {
          res
            .status(200)
            .send({ message: "ya existe un plan de servidor con ese nombre", error: "0" })
        }
      })
      .catch(err => {
        console.log("error", err)
        res.status(404).send({
          message:
            "ha ocurrido un error en su peticion al tratar de modificar un plan de servidor",
          error: "1"
        })
      })
  })
  
  //eliminar data
  app.post("/plan/delete", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        const sql =`UPDATE plan_servidor
        SET plan_borrar = '1'
        WHERE plan_id = $1;`
        const params = [req.body.plan_id]
        return client.query(sql, params);
      })
      .then(results => {
          res
            .status(200)
            .send({ message: "Informacion eliminada con exito", error: "0" })
        })
        .catch(err => {
          res.status(404).send({
            message:
              "ha ocurrido un error en su peticion al tratar eliminar un data center",
            error: "1"
          })
        })
    })
    
  //buscaqueda like data
  app.post("/plan/like", (req, res) => {
    const client = new Client();
    client
      .connect()
      .then(() => {
        const sql = `SELECT plan_id, plan_name, plan_orden, plan_borrar
        FROM plan_servidor where 
        plan_borrar = '0' and plan_name LIKE '${req.body.search}%' limit 5`;
        console.log(sql)
        return client.query(sql);
      })
      .then(results => {
        //si consiguio envia
        if (results.rowCount != 0) res.status(200).send(results.rows);
        else res.status(200).send({ message: "nada" }); //sino consiguio envia envia un msj diciendo nada
      })
      .catch(err => {
        res.status(404).send({
          message: "ha ocurrido un error un su peticion de busqueda de plan de servidor",
          error: "1"
        });
      });
  });




//___Corriendo el Servidor
app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
});
