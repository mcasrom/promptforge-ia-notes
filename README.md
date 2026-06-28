# PromptForge - IA Notes 🚀

Una plataforma de alto rendimiento, ágil y de baja fricción diseñada para compartir, buscar, filtrar e interactuar con la comunidad sobre **Prompts, Buenas Prácticas y trucos de Inteligencia Artificial**.

Este proyecto cuenta con un backend completo en Node.js (Express) y un frontend interactivo moderno en React (Vite) con animaciones fluidas y diseño adaptativo ultra-pulido.

---

## 🔍 Nombres Sugeridos para tu Repositorio de GitHub

Si estás alojando este proyecto bajo el usuario `mcasrom`, aquí tienes las mejores opciones estructuradas para SEO y atractivo profesional:

1. **`promptforge-ia-notes`** (Altamente recomendado: combina la marca, el propósito y es sumamente descriptivo para motores de búsqueda).
2. **`ia-notes-community`** (Enfocado en la comunidad de intercambio de prompts).
3. **`expert-prompts-hub`** (Resalta el valor de las valoraciones de expertos y usuarios privilegiados).

---

## 👥 Credenciales de Prueba (Usuarios Sembrados)

Para probar todas las funciones, el sistema viene precargado con los siguientes usuarios de prueba:

| Rol | Correo Electrónico | Contraseña | Descripción |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@ianotes.com` | `admin123` | Control total, puede destacar publicaciones y administrar contenido. |
| **Usuario Privilegiado** | `privileged@ianotes.com` | `privileged123` | Usuario experto. Su valoración añade el **Sello de Calidad Experta**. |
| **Usuario Estándar 1** | `user@ianotes.com` | `user123` | Usuario regular de la comunidad para comentar y dar like. |
| **Usuario Estándar 2** | `laura@ianotes.com` | `laura123` | Usuario regular de la comunidad para comentar y dar like. |

---

## 🛡️ Medidas de Seguridad y Antifraude en Registro

El sistema de registro cuenta con medidas integradas para proteger la plataforma contra spam, bots y abusos:

1. **Limitación de Tasa (Rate Limiting) por IP**: Evita registros masivos limitando el número máximo de cuentas creadas por dirección IP dentro de una ventana de tiempo (máximo 5 registros cada 15 minutos).
2. **Bloqueo de Correos Temporales / Desechables**: Se rechazan automáticamente registros provenientes de dominios temporales comunes conocidos por spam (`yopmail.com`, `mailinator.com`, `tempmail.com`, etc.).
3. **Validación de Formato Estricto (RFC 5322)**: Verificación robusta mediante expresiones regulares para garantizar la validez del correo electrónico.
4. **Fortaleza de Contraseñas Obligatoria**: Exige contraseñas de al menos 8 caracteres que contengan obligatoriamente tanto letras como números.
5. **Sanitización contra Inyección XSS**: Limpieza y desinfección automática de etiquetas HTML/scripts en el campo de nombre antes de guardarlo en la base de datos.

---

## 💻 Instalación y Uso Local

Sigue estos pasos para ejecutar la aplicación localmente en tu computadora:

### Requisitos Previos
* **Node.js** (versión 18 o superior recomendada)
* **npm** o **yarn**

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en el archivo `.env.example`:
```bash
cp .env.example .env
```
Y define la variable:
```env
APP_URL="http://localhost:3000"
```

### Paso 3: Iniciar en modo de desarrollo
```bash
npm run dev
```
*La aplicación estará disponible en tu navegador en `http://localhost:3000` con recarga rápida.*

### Paso 4: Compilar para producción
Para generar el paquete optimizado de producción:
```bash
npm run build
```

### Paso 5: Ejecutar en producción local
```bash
npm run start
```

---

## 🖥️ Despliegue en Servidor VPS (Hetzner, DigitalOcean, etc.)

La aplicación es extremadamente ligera y eficiente, ideal para servidores VPS pequeños.

### Requisitos y Recursos Necesarios
* **Espacio en disco**: Menos de **150 MB** (incluyendo dependencias de Node.js).
* **Consumo de memoria RAM**: Entre **50 MB y 100 MB** de RAM activa, permitiendo correr perfectamente en la instancia más económica de Hetzner (ej. CX22 de 2GB de RAM o inferiores).
* **Base de datos**: Utiliza un sistema de base de datos JSON local ultra veloz en la raíz (`src/db.json`), por lo que no requiere configuraciones externas iniciales de bases de datos pesadas.

### Despliegue con PM2 (Recomendado)
PM2 mantendrá tu aplicación corriendo de fondo permanentemente y la reiniciará si el servidor se apaga:

1. Instala PM2 globalmente en tu VPS Hetzner:
   ```bash
   sudo npm install -g pm2
   ```
2. Clona tu repositorio y compila:
   ```bash
   npm install
   npm run build
   ```
3. Inicia la aplicación con PM2:
   ```bash
   pm2 start npm --name "promptforge" -- run start
   ```
4. Guarda la lista de procesos y configura el arranque automático de PM2:
   ```bash
   pm2 save
   pm2 startup
   ```

### Configuración con Nginx (Proxy Inverso)
Para mapear tu dominio (ej. `promptforge.com`) al puerto `3000` interno con certificado SSL gratis de Let's Encrypt:

1. Instala Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```
2. Crea un archivo de configuración para tu sitio: `/etc/nginx/sites-available/promptforge`
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Activa la configuración y recarga Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/promptforge /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```
4. Añade SSL con Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d tu-dominio.com
   ```

---

## 🚀 Despliegue en Vercel o Netlify

La aplicación cliente de React está lista para ser desplegada en Vercel en segundos:

1. Conecta tu repositorio de GitHub a tu panel de Vercel.
2. Selecciona **Vite** como el preset del proyecto.
3. El comando de build será `npm run build` y la carpeta de salida será `dist`.
4. ¡Haz clic en **Deploy** y tu frontend estará online de forma gratuita!

*Nota: Para despliegues 100% serverless en Vercel donde desees usar base de datos en la nube permanente en lugar del archivo JSON local, el archivo `README.md` original cuenta con la estructura del script SQL de Supabase para migrar el backend fácilmente a Supabase.*

---

## 📂 Estructura del Proyecto

```text
├── /src/
│   ├── /components/           # Componentes modulares interactivos
│   │   ├── AuthModal.tsx      # Modal de login y signup seguro
│   │   ├── CreatePostModal.tsx# Creador de prompts con preview Markdown
│   │   ├── Hero.tsx           # Encabezado visual estilo Linear dark
│   │   ├── Navbar.tsx         # Barra de navegación receptiva
│   │   ├── PostCard.tsx       # Fichas de prompts con valoraciones y me gustas
│   │   ├── PostDetailsModal.tsx # Debate interactivo y sistema de valoración ★
│   │   └── Toast.tsx          # Alertas fluidas del sistema
│   ├── App.tsx                # Estado central del cliente React
│   ├── index.css              # Fuentes (Space Grotesk, JetBrains Mono) e Tailwind
│   ├── main.tsx               # Punto de entrada de React
│   ├── types.ts               # Tipos estrictos de TypeScript
│   └── utils.ts               # Utilidades de red y formato temporal
├── .env.example               # Ejemplo de variables de entorno
├── server.ts                  # Servidor Express, API REST, persistencia y antifraude
├── package.json               # Dependencias del proyecto
└── vite.config.ts             # Configuración de empaquetado Vite
```

---

Desarrollado y pulido con pasión para la comunidad de creadores de IA. ¡Disfruta compartiendo tus mejores prompts! 🌟
