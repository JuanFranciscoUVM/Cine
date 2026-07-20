================================================================================
CineVision - README de despliegue (e-actividad 3.1)
================================================================================

1) ARCHIVOS QUE DEBE CREAR (NO van en el repositorio)
--------------------------------------------------------------------------------

A) Archivo: .env  (en la raíz del proyecto)
   Copie .env.example como .env y complete los valores.

   Formato (clave=valor, una por línea, sin comillas):

     PORT=3000

     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=cine_user
     DB_PASSWORD=cine_password
     DB_NAME=cine
     DB_PATH=./database/cine.sqlite

     JWT_SECRET=una_frase_secreta_larga_y_unica
     JWT_EXPIRES_IN=8h

   Descripción:
   - PORT: puerto HTTP del servidor Express
   - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME: configuración de acceso
     a la base de datos leída desde variables de entorno (credenciales sensibles)
   - DB_PATH: ruta del archivo SQLite (cine.sqlite). No subir al repositorio.
   - JWT_SECRET: frase secreta para firmar/verificar tokens JWT (obligatoria)
   - JWT_EXPIRES_IN: tiempo de vida del token (ej. 8h, 1d)

B) El archivo .env y los *.sqlite están en .gitignore y NO deben subirse al repo.


2) PRIMERA EJECUCIÓN EN UN SERVIDOR NUEVO (migraciones)
--------------------------------------------------------------------------------

   npm install
   npm run migrate
   npm start

   El script de migración (database/migrate.js) con SQLite:
   - Crea el archivo database/cine.sqlite si no existe
   - Crea tablas: usuarios, peliculas, salas, funciones, reservaciones, tickets
   - Inserta usuarios semilla con contraseñas cifradas (bcrypt)
   - Si existe data.json de la actividad anterior, importa películas/salas/etc.

   Usuarios de prueba tras migrar:
     admin@cine.com     / admin123     -> rol admin
     empleado@cine.com  / empleado123  -> rol empleado
     cliente@cine.com   / cliente123   -> rol cliente


3) ACCESO SIN LOGIN
--------------------------------------------------------------------------------

   Sin sesión NO se puede entrar a ninguna ruta del panel ni de la API de datos.

   Únicas rutas abiertas:
   - GET/POST /login
   - GET/POST /registro
   - POST /api/auth/login
   - POST /api/auth/register

   El resto exige JWT. Vistas → redirect a /login. API → 401 con advertencia.


4) ROLES Y OPERACIONES LIMITADAS
--------------------------------------------------------------------------------

   ADMIN — gestiona catálogo:
   - Panel: Películas, Salas, Funciones (solo ver)
   - POST/PUT/DELETE películas · POST/PUT salas

   EMPLEADO — opera programación y boletería:
   - Panel: Películas/Salas (ver), Funciones (gestionar), Reservaciones
   - POST/PUT funciones · DELETE función/película · DELETE reservación · GET últimas

   CLIENTE — reserva entradas:
   - Panel: Películas/Funciones (ver), Reservaciones (crear/editar)
   - POST/PUT reservaciones · GET reservación por id
   - NO accede a /salas ni gestiona catálogo

   Si un rol no autorizado intenta una operación o página, recibe advertencia 403.


5) AUTENTICACIÓN
--------------------------------------------------------------------------------

   - Login vista:  GET/POST /login
   - Registro:     GET/POST /registro
   - API login:    POST /api/auth/login   { "email", "password" }
   - API registro: POST /api/auth/register { "email", "nombre", "password", "rol" }
   - Perfil:       GET  /api/auth/me   (Bearer token)

   El token JWT se guarda en cookie "token" y también se envía en
   Authorization: Bearer <token> desde las vistas.


6) ESTRUCTURA RELEVANTE
--------------------------------------------------------------------------------

   config/index.js          -> lee .env
   middleware/auth.js       -> JWT y roles
   controllers/             -> lógica de negocio (promesas + SQL)
   routes/                  -> responden HTTP
   database/db.js           -> conexión SQLite (better-sqlite3) con promesas
   database/cine.sqlite     -> archivo de base de datos (generado por migrate)
   database/migrate.js      -> migraciones
   database/migrations/     -> scripts de migración SQL
   views/                   -> EJS (login, registro, permisos, CRUD)


7) NOTA SOBRE SQLITE
--------------------------------------------------------------------------------

   El motor de base de datos es SQLite. El archivo se crea en DB_PATH
   (por defecto ./database/cine.sqlite). Las credenciales DB_* y JWT_SECRET
   se leen desde .env para migrar el sistema a otro servidor sin exponer
   secretos en el repositorio.

================================================================================
