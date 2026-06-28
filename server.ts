import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "src", "db.json");

// Define basic structural interfaces for the file database
interface DBUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // Plain password for simulation simplicity
  role: "admin" | "privileged" | "user";
  avatarUrl?: string;
  createdAt: string;
}

interface DBPost {
  id: string;
  title: string;
  content: string;
  tags: string[];
  userId: string;
  isFeatured: boolean;
  likedByUserIds: string[];
  ratings?: { [userId: string]: number }; // Map of userId -> score (1 to 5)
  createdAt: string;
}

interface DBComment {
  id: string;
  postId: string;
  parentId?: string; // For replies
  userId: string;
  content: string;
  createdAt: string;
}

interface DBStructure {
  users: DBUser[];
  posts: DBPost[];
  comments: DBComment[];
}

// Default initial seed data
const DEFAULT_DB: DBStructure = {
  users: [
    {
      id: "u-admin",
      email: "admin@ianotes.com",
      name: "Admin IA Notes",
      passwordHash: "admin123", // Simple for testing
      role: "admin",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      createdAt: new Date().toISOString(),
    },
    {
      id: "u-privileged",
      email: "privileged@ianotes.com",
      name: "Alex Expert",
      passwordHash: "privileged123",
      role: "privileged",
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200",
      createdAt: new Date().toISOString(),
    },
    {
      id: "u-user-1",
      email: "user@ianotes.com",
      name: "Santi PromptForge",
      passwordHash: "user123",
      role: "user",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      createdAt: new Date().toISOString(),
    },
    {
      id: "u-user-2",
      email: "laura@ianotes.com",
      name: "Laura AI",
      passwordHash: "laura123",
      role: "user",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      createdAt: new Date().toISOString(),
    }
  ],
  posts: [
    {
      id: "p-1",
      title: "Cómo evitar alucinaciones en Claude 3.5 Sonnet usando XML Tags",
      content: `Las alucinaciones son uno de los mayores dolores de cabeza al trabajar con LLMs. Aquí te presento un método de ingeniería de prompts muy ágil usando etiquetas XML para estructurar la respuesta de Claude.

### Estructura de Prompt recomendada:
\`\`\`xml
<system_instruction>
Eres un analista de datos experto. Responde ÚNICAMENTE basándote en el contexto provisto. Si no estás seguro, di "NO_DATA".
</system_instruction>

<context>
[Inserta tus datos o documentos aquí]
</context>

<task>
Genera un resumen ejecutivo de la facturación trimestral.
</task>
\`\`\`

### ¿Por qué funciona?
Los modelos de Anthropic están pre-entrenados específicamente para interpretar etiquetas XML como límites claros de información. Esto encapsula el contexto y reduce las desviaciones cognitivas del modelo de manera radical.`,
      tags: ["best-practices", "prompts"],
      userId: "u-user-1",
      isFeatured: true,
      likedByUserIds: ["u-admin", "u-user-2"],
      ratings: {
        "u-admin": 5,
        "u-privileged": 5,
        "u-user-2": 4
      },
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    },
    {
      id: "p-2",
      title: "System Prompt definitivo para refactorización de código TypeScript",
      content: `Este prompt me ha ahorrado horas de trabajo al migrar código JavaScript antiguo a TypeScript limpio y tipado.

\`\`\`markdown
Actúa como un compilador de TypeScript súper estricto y un experto en arquitectura limpia. 
Tu tarea es refactorizar el código JavaScript provisto en TypeScript de producción:

1. Agrega tipos e interfaces explícitos para todo (evita usar 'any').
2. Aplica principios SOLID y divide funciones grandes.
3. Devuelve SOLAMENTE el código TS formateado listo para copiar.
4. Explica brevemente (máximo 3 bullets) las decisiones de diseño clave al final en un bloque de comentarios.
\`\`\`

¡Pruébalo en tu CLI de Ollama o tu editor favorito!`,
      tags: ["prompts", "ollama"],
      userId: "u-user-2",
      isFeatured: false,
      likedByUserIds: ["u-user-1"],
      ratings: {
        "u-user-1": 4,
        "u-privileged": 5
      },
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    },
    {
      id: "p-3",
      title: "Alucinaciones con Ollama en local: Ajustando la Temperatura",
      content: `Si estás corriendo modelos como Llama 3 o Phi 3 de forma local mediante Ollama y notas que inventa demasiados detalles o parámetros de código, el problema es casi seguro la **temperatura**.

Por defecto, Ollama usa una temperatura moderada (alrededor de 0.7 - 0.8). Para tareas lógicas y de codificación estricta:
1. Usa el parámetro \`temperature 0.0\` o \`0.2\` en tu Modelfile.
2. Sube el \`num_ctx\` a un valor acorde a tu memoria RAM (ej. \`8192\`).

Crear un archivo \`Modelfile\`:
\`\`\`dockerfile
FROM llama3
# Ajusta parámetros de creatividad y coherencia
PARAMETER temperature 0.2
PARAMETER num_ctx 8192
\`\`\`

Luego corre \`ollama create mi-llama3 -f ./Modelfile\`. ¡La diferencia de precisión es del día a la noche!`,
      tags: ["ollama", "errores", "best-practices"],
      userId: "u-user-1",
      isFeatured: false,
      likedByUserIds: ["u-admin", "u-user-2"],
      ratings: {
        "u-admin": 4,
        "u-user-2": 3
      },
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
    }
  ],
  comments: [
    {
      id: "c-1",
      postId: "p-1",
      userId: "u-admin",
      content: "Excelente aporte. Personalmente he notado que Claude respeta mucho mejor los límites de contexto cuando se usan tags en mayúsculas como <CONTEXTO></CONTEXTO>.",
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    },
    {
      id: "c-2",
      postId: "p-1",
      parentId: "c-1",
      userId: "u-user-1",
      content: "¡Totalmente de acuerdo! También es útil colocar una etiqueta <example> para dar un formato few-shot de referencia.",
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
    {
      id: "c-3",
      postId: "p-2",
      userId: "u-admin",
      content: "Aprobado. Este system prompt reduce un montón la verbosidad típica de los modelos.",
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    }
  ]
};

// Helper to read database
function readDB(): DBStructure {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Ensure the directory exists
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database file, returning default in-memory db", err);
    return DEFAULT_DB;
  }
}

// Helper to write database
function writeDB(data: DBStructure) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Init DB
  readDB();

  // --- API Authentication Routes ---

  // Simple in-memory rate limiter for signup requests (anti-fraud/bot protection)
  const signupRateLimit: { [ip: string]: { count: number; lastRequest: number } } = {};

  // List of banned disposable email domains commonly used for fraud/spam
  const BANNED_EMAIL_DOMAINS = [
    "yopmail.com",
    "mailinator.com",
    "tempmail.com",
    "guerrillamail.com",
    "10minutemail.com",
    "dispostable.com",
    "getairmail.com",
    "throwawaymail.com",
    "sharklasers.com",
    "tempmailaddress.com"
  ];

  // Register
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, name, avatarUrl } = req.body;
    
    // 1. Mandatory fields validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // 2. Anti-fraud: In-memory Rate Limiting per IP address
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const rateLimitWindow = 15 * 60 * 1000; // 15 minutes window
    const maxRegistrations = 5; // Max 5 registrations per window
    
    if (!signupRateLimit[ip]) {
      signupRateLimit[ip] = { count: 1, lastRequest: now };
    } else {
      const record = signupRateLimit[ip];
      if (now - record.lastRequest > rateLimitWindow) {
        // Reset window
        record.count = 1;
        record.lastRequest = now;
      } else {
        record.count += 1;
        record.lastRequest = now;
        if (record.count > maxRegistrations) {
          return res.status(429).json({ 
            error: "Has alcanzado el límite de intentos de registro. Por favor, inténtalo más tarde (medida de seguridad antifraude)." 
          });
        }
      }
    }

    // 3. RFC 5322 Email regex verification
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "El formato del correo electrónico no es válido" });
    }

    // 4. Anti-fraud: Check for disposable/spam email domains
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && BANNED_EMAIL_DOMAINS.includes(domain)) {
      return res.status(400).json({ 
        error: "Los correos de dominios temporales o desechables no están permitidos por medidas de seguridad antifraude." 
      });
    }

    // 5. Password strength validation (At least 8 chars, 1 letter, 1 number)
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ 
        error: "La contraseña debe tener al menos 8 caracteres e incluir tanto letras como números (requisito de seguridad)." 
      });
    }

    // 6. Sanitization: Strip HTML/script tags from user-provided fields to prevent XSS
    const sanitizedName = name.replace(/<[^>]*>/g, "").trim();
    if (!sanitizedName || sanitizedName.length < 2) {
      return res.status(400).json({ error: "El nombre provisto no es válido o contiene caracteres no permitidos" });
    }

    const db = readDB();
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: "El correo electrónico ya está registrado" });
    }

    // Simple role assignment: email containing "admin" gets admin, email containing "privileged" or "expert" gets privileged, else user
    const role = email.toLowerCase().includes("admin")
      ? "admin"
      : (email.toLowerCase().includes("privileged") || email.toLowerCase().includes("expert"))
        ? "privileged"
        : "user";

    const newUser: DBUser = {
      id: "u-" + Date.now(),
      email: email.toLowerCase(),
      name: sanitizedName,
      passwordHash: password, // For simulation simplicity
      role,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sanitizedName)}`,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    writeDB(db);

    const { passwordHash, ...userResponse } = newUser;
    res.status(201).json({ user: userResponse });
  });

  // Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Faltan credenciales" });
    }

    const db = readDB();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
    );

    if (!user) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const { passwordHash, ...userResponse } = user;
    res.json({ user: userResponse });
  });

  // Get current user (Mock)
  app.post("/api/auth/me", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const db = readDB();
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const { passwordHash, ...userResponse } = user;
    res.json({ user: userResponse });
  });

  // --- API Posts & Feed Routes ---

  // Get posts (with search and tag filters)
  app.get("/api/posts", (req, res) => {
    const { tag, search } = req.query;
    const db = readDB();

    let filteredPosts = [...db.posts];

    // Filter by tag
    if (tag && typeof tag === "string" && tag !== "all") {
      filteredPosts = filteredPosts.filter((post) =>
        post.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
      );
    }

    // Filter by search query
    if (search && typeof search === "string") {
      const q = search.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.content.toLowerCase().includes(q)
      );
    }

    // Sort: Featured first, then newest first
    filteredPosts.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Populate post with owner user info and rating metrics
    const populatedPosts = filteredPosts.map((post) => {
      const owner = db.users.find((u) => u.id === post.userId);
      const ratingsMap = post.ratings || {};
      const ratingValues = Object.values(ratingsMap);
      const ratingsCount = ratingValues.length;
      const averageRating = ratingsCount > 0
        ? Number((ratingValues.reduce((sum, v) => sum + v, 0) / ratingsCount).toFixed(1))
        : 0;

      // Find privileged/admin ratings
      const privilegedRatings: number[] = [];
      Object.entries(ratingsMap).forEach(([uId, score]) => {
        const u = db.users.find((user) => user.id === uId);
        if (u && (u.role === "privileged" || u.role === "admin")) {
          privilegedRatings.push(score);
        }
      });
      const averagePrivilegedRating = privilegedRatings.length > 0
        ? Number((privilegedRatings.reduce((sum, v) => sum + v, 0) / privilegedRatings.length).toFixed(1))
        : 0;

      return {
        ...post,
        likesCount: post.likedByUserIds.length,
        ratings: ratingsMap,
        averageRating,
        ratingsCount,
        averagePrivilegedRating,
        user: {
          name: owner ? owner.name : "Usuario Eliminado",
          avatarUrl: owner?.avatarUrl,
          role: owner ? owner.role : "user",
        },
      };
    });

    res.json(populatedPosts);
  });

  // Create post
  app.post("/api/posts", (req, res) => {
    const { title, content, tags, userId } = req.body;
    if (!title || !content || !userId) {
      return res.status(400).json({ error: "Faltan campos del post" });
    }

    const db = readDB();
    const creator = db.users.find((u) => u.id === userId);
    if (!creator) {
      return res.status(401).json({ error: "Usuario creador inválido" });
    }

    const cleanTags = Array.isArray(tags)
      ? tags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0)
      : ["general"];

    const newPost: DBPost = {
      id: "p-" + Date.now(),
      title,
      content,
      tags: cleanTags.length > 0 ? cleanTags : ["general"],
      userId,
      isFeatured: false,
      likedByUserIds: [],
      createdAt: new Date().toISOString(),
    };

    db.posts.push(newPost);
    writeDB(db);

    res.status(201).json({
      ...newPost,
      likesCount: 0,
      user: {
        name: creator.name,
        avatarUrl: creator.avatarUrl,
        role: creator.role,
      },
    });
  });

  // Delete post
  app.delete("/api/posts/:id", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body; // In real auth, we decode from token

    const db = readDB();
    const postIndex = db.posts.findIndex((p) => p.id === id);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    const post = db.posts[postIndex];
    const user = db.users.find((u) => u.id === userId);

    if (!user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    // Only Admin or the post owner can delete
    if (user.role !== "admin" && post.userId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para borrar este post" });
    }

    // Remove post
    db.posts.splice(postIndex, 1);
    // Remove related comments
    db.comments = db.comments.filter((c) => c.postId !== id);

    writeDB(db);
    res.json({ success: true, message: "Post y comentarios eliminados correctamente" });
  });

  // Toggle post Like
  app.post("/api/posts/:id/like", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Debes iniciar sesión para dar me gusta" });
    }

    const db = readDB();
    const post = db.posts.find((p) => p.id === id);
    if (!post) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    const likedIndex = post.likedByUserIds.indexOf(userId);
    if (likedIndex > -1) {
      // Unlike
      post.likedByUserIds.splice(likedIndex, 1);
    } else {
      // Like
      post.likedByUserIds.push(userId);
    }

    writeDB(db);
    res.json({
      likesCount: post.likedByUserIds.length,
      likedByUserIds: post.likedByUserIds,
    });
  });

  // Rate a post (score 1-5)
  app.post("/api/posts/:id/rate", (req, res) => {
    const { id } = req.params;
    const { userId, score } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Debes iniciar sesión para valorar" });
    }

    const ratingScore = Number(score);
    if (isNaN(ratingScore) || ratingScore < 1 || ratingScore > 5) {
      return res.status(400).json({ error: "La valoración debe ser un número del 1 al 5" });
    }

    const db = readDB();
    const post = db.posts.find((p) => p.id === id);
    if (!post) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    if (!post.ratings) {
      post.ratings = {};
    }

    post.ratings[userId] = ratingScore;
    writeDB(db);

    const ratingsMap = post.ratings || {};
    const ratingValues = Object.values(ratingsMap);
    const ratingsCount = ratingValues.length;
    const averageRating = ratingsCount > 0
      ? Number((ratingValues.reduce((sum, v) => sum + v, 0) / ratingsCount).toFixed(1))
      : 0;

    // Find privileged/admin ratings
    const privilegedRatings: number[] = [];
    Object.entries(ratingsMap).forEach(([uId, s]) => {
      const u = db.users.find((user) => user.id === uId);
      if (u && (u.role === "privileged" || u.role === "admin")) {
        privilegedRatings.push(s);
      }
    });
    const averagePrivilegedRating = privilegedRatings.length > 0
      ? Number((privilegedRatings.reduce((sum, v) => sum + v, 0) / privilegedRatings.length).toFixed(1))
      : 0;

    res.json({
      ratings: ratingsMap,
      averageRating,
      ratingsCount,
      averagePrivilegedRating
    });
  });

  // Toggle Feature (Admin Only)
  app.put("/api/posts/:id/feature", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    const db = readDB();
    const user = db.users.find((u) => u.id === userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Solo los administradores pueden destacar posts" });
    }

    const post = db.posts.find((p) => p.id === id);
    if (!post) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    post.isFeatured = !post.isFeatured;
    writeDB(db);

    res.json({ isFeatured: post.isFeatured });
  });

  // --- API Comments Routes ---

  // Get comments for a post
  app.get("/api/posts/:id/comments", (req, res) => {
    const { id } = req.params;
    const db = readDB();

    const postComments = db.comments.filter((c) => c.postId === id);

    // Build hierarchical tree
    const commentMap = new Map<string, any>();
    const roots: any[] = [];

    // First pass: add user details and structure in map
    postComments.forEach((c) => {
      const owner = db.users.find((u) => u.id === c.userId);
      commentMap.set(c.id, {
        ...c,
        user: {
          name: owner ? owner.name : "Usuario Eliminado",
          avatarUrl: owner?.avatarUrl,
          role: owner ? owner.role : "user",
        },
        replies: [],
      });
    });

    // Second pass: wire replies to parents
    commentMap.forEach((c) => {
      if (c.parentId && commentMap.has(c.parentId)) {
        commentMap.get(c.parentId).replies.push(c);
      } else {
        roots.push(c);
      }
    });

    // Sort by oldest first
    const sortByDate = (arr: any[]) => {
      arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      arr.forEach((item) => {
        if (item.replies && item.replies.length > 0) {
          sortByDate(item.replies);
        }
      });
    };

    sortByDate(roots);
    res.json(roots);
  });

  // Create Comment / Reply
  app.post("/api/posts/:id/comments", (req, res) => {
    const { id } = req.params;
    const { content, userId, parentId } = req.body;

    if (!content || !userId) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const db = readDB();
    const creator = db.users.find((u) => u.id === userId);
    if (!creator) {
      return res.status(401).json({ error: "Usuario inválido" });
    }

    const newComment: DBComment = {
      id: "c-" + Date.now(),
      postId: id,
      parentId: parentId || undefined,
      userId,
      content,
      createdAt: new Date().toISOString(),
    };

    db.comments.push(newComment);
    writeDB(db);

    res.status(201).json({
      ...newComment,
      user: {
        name: creator.name,
        avatarUrl: creator.avatarUrl,
        role: creator.role,
      },
      replies: [],
    });
  });

  // Delete Comment (Admin or comment owner)
  app.delete("/api/comments/:id", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    const db = readDB();
    const commentIndex = db.comments.findIndex((c) => c.id === id);
    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    const comment = db.comments[commentIndex];
    const user = db.users.find((u) => u.id === userId);

    if (!user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    // Only Admin or Comment owner can delete
    if (user.role !== "admin" && comment.userId !== userId) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este comentario" });
    }

    // Remove this comment
    db.comments.splice(commentIndex, 1);

    // Also remove recursive child replies to keep data clean
    const removeRepliesRecursively = (parentId: string) => {
      const childReplies = db.comments.filter((c) => c.parentId === parentId);
      childReplies.forEach((child) => {
        const index = db.comments.findIndex((c) => c.id === child.id);
        if (index > -1) {
          db.comments.splice(index, 1);
        }
        removeRepliesRecursively(child.id);
      });
    };

    removeRepliesRecursively(id);
    writeDB(db);

    res.json({ success: true, message: "Comentario y sus respuestas eliminados" });
  });

  // --- Serve Frontend ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
