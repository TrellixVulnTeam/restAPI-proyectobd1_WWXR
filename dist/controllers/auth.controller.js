"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logIn = exports.signUp = void 0;
const database_1 = require("../database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const persona_natural_1 = require("../Clases/persona_natural");
const persona_juridica_1 = require("../Clases/persona_juridica");
const QR_1 = require("../Clases/QR");
const usuario_1 = require("../Clases/usuario");
const PoolEnUso = database_1.LocalPool;
//Funcion para encriptar un password
function encryptPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        const salt = yield bcrypt_1.default.genSalt(10);
        return yield bcrypt_1.default.hash(password, salt);
    });
}
const signUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //hay que obtener todo lo necesario para insertar una persona y su usuario
        const { tipo, user, email, password, rol, cedula, rif, primernombre, segundonombre, primerapellido, segundoapellido, persona_contacto, codigo_residencia, razon_social, denom_comercial, web, capital, direccion_fisica, direccion_fiscal } = req.body;
        //Una mini validacion
        if (!email || !password || !user) {
            res.status(400).json({ message: 'Faltan campos' });
            return;
        }
        //Verificamos que el usuario no exista 
        var newUser = new usuario_1.usuario(user, email, password, [rol]);
        if (yield newUser.existeEnBD()) {
            res.status(400).json({ message: 'Ya existe un usuario con ese nombre o esa direccion e-mail' });
            return;
        }
        //Se encripta el password
        const encryptedPassword = yield encryptPassword(password);
        switch (tipo) {
            case 'nat': {
                //Verificamos que no exista esa persona natural
                var newPersonaNat = new persona_natural_1.persona_natural(cedula, rif, primernombre, segundonombre, primerapellido, segundoapellido, persona_contacto, codigo_residencia);
                if (yield newPersonaNat.existeEnBD()) {
                    res.status(400).json({ message: `La persona con cedula ${cedula} ya esta registrada` });
                    return;
                }
                //Insertamos la persona natural
                const InsercionNat = yield PoolEnUso.query(`INSERT INTO persona_natural 
                                                                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [cedula, rif, primernombre, segundonombre, primerapellido, segundoapellido, new Date(), persona_contacto, codigo_residencia]);
                //Generamos el QR del nuevo cliente
                yield QR_1.QR.generarQR(cedula, `http://localhost:3000/api/clientes/naturales/${cedula}`);
                //Insertamos al cliente
                const InsercionCli = yield PoolEnUso.query(`INSERT INTO cliente_nat 
                                                                    VALUES ($1,$2,$3,$4,$5)`, [cedula, false, 0, 1, `C:\\ImagenesBD\\QR\\${cedula}.png`]);
                //ahora si creamo el usuario
                const InsercionUser = yield PoolEnUso.query(`INSERT INTO usuarios (nombre_usu, password_usu, direccion_ema, fk_roles,fk_persona_nat) 
                                                                    VALUES ($1,$2,$3,$4,$5)`, [user, encryptedPassword, email, rol, cedula]);
                res.status(201).json({ message: `El usuario ${user} fue registrado exitosamente` });
            }
            case 'jur': {
                //Verificamos que no exista esa persona juridica
                var newPersonaJur = new persona_juridica_1.persona_juridica(rif, razon_social, denom_comercial, web, capital, direccion_fisica, direccion_fiscal);
                if (yield newPersonaJur.existeEnBD()) {
                    res.status(400).json({ message: `La persona con RIF ${rif} ya esta registrada` });
                    return;
                }
                //Insertamos la persona natural
                const InsercionNat = yield PoolEnUso.query(`INSERT INTO persona_juridica 
                                                                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [rif, razon_social, denom_comercial, web, capital, new Date(), direccion_fisica, direccion_fiscal]);
                //Generamos el QR del nuevo cliente
                yield QR_1.QR.generarQR(rif, `http://localhost:3000/api/clientes/juridicos/${rif}`);
                //Insertamos al cliente
                const InsercionCli = yield PoolEnUso.query(`INSERT INTO cliente_jur 
                                                                    VALUES ($1,$2,$3,$4,$5)`, [rif, 0, 1, false, `C:\\ImagenesBD\\QR\\${rif}.png`]);
                //ahora si creamos el usuario
                const InsercionUser = yield PoolEnUso.query(`INSERT INTO usuarios (nombre_usu, password_usu, direccion_ema, fk_roles,fk_persona_jur) 
                                                                    VALUES ($1,$2,$3,$4,$5)`, [user, encryptedPassword, email, rol, rif]);
                res.status(201).json({ message: `El usuario ${user} fue registrado exitosamente` });
            }
        }
    }
    catch (error) {
        console.log(error);
    }
});
exports.signUp = signUp;
const logIn = (req, res) => {
    res.status(200).send('LOGIN');
};
exports.logIn = logIn;
