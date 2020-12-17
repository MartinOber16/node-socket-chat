const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const { crearMensaje } = require('../utilidades/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {

        console.log('entrarChat: ', data);

        if(!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre/sala es necesario'
            });
        }

        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala);

        let mensaje = crearMensaje('Administrador', `${data.nombre} ingreso el chat`);
        
        client.broadcast.to(data.sala).emit('crearMensaje', mensaje);
        client.broadcast.to(data.sala).emit('listaPersonas', usuarios.getPersonasPorSala(data.sala));
        
        callback(usuarios.getPersonasPorSala(data.sala));
    });

    client.on('crearMensaje', (data, callback) => {
        
        console.log('crearMensaje: ', data);

        let persona = usuarios.getPersona(client.id);
        let mensaje = crearMensaje(persona.nombre, data.mensaje);

        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
        client.broadcast.to(persona.sala).emit('listaPersonas', usuarios.getPersonasPorSala(persona.sala));

        callback(mensaje);

    });

    client.on('disconnect', () => {
        
        let personaBorrada = usuarios.borrarPesona(client.id);
        console.log('disconnect: ', personaBorrada);
        
        let mensaje = crearMensaje('Administrador', `${personaBorrada.nombre} abandono el chat`);
        
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', mensaje);
        client.broadcast.to(personaBorrada.sala).emit('listaPersonas', usuarios.getPersonasPorSala(personaBorrada.sala));

    });

    // Mensajes privados
    client.on('mensajePrivado', (data) => {

        console.log('mensajePrivado: ', data);

        let persona = usuarios.getPersona(client.id);

        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));

    });

});
