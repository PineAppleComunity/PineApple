using MongoDB.Driver;
using MongoDB.Bson;
using SendGrid;
using SendGrid.Helpers.Mail;
using MongoDB.Bson.Serialization; 
using MongoDB.Bson.IO;

var builder = WebApplication.CreateBuilder(args);

// Habilitar CORS para comunicación entre Wizard, Dashboard y API
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

// --- CONFIGURACIÓN DE MONGODB (SINGLETON) ---
const string connectionString = "mongodb://localhost:27017";
const string dbName = "HumanageDB";
var mongoClient = new MongoClient(connectionString);
var database = mongoClient.GetDatabase(dbName);

var app = builder.Build();
app.UseCors();

// --- 1. ENDPOINT PARA RECIBIR DATOS (WIZARD) ---
app.MapPost("/api/relevamiento", async (HttpContext context) => {
    try {
        var collection = database.GetCollection<BsonDocument>("Relevamientos");

        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();
        var document = BsonDocument.Parse(body);

        // Persistencia en MongoDB
        await collection.InsertOneAsync(document);

        // --- LÓGICA DE NOTIFICACIÓN VÍA SENDGRID ---
        var apiKey = "TU_API_KEY_ACA"; 
        if (apiKey != "TU_API_KEY_ACA") {
            var sendGridClient = new SendGridClient(apiKey);
            var from = new EmailAddress("wizard@cardinal.com", "Sistema Humanage");
            
            // CORRECCIÓN: El nombre sale de responsable.empresa_grupo (el JSON que armamos hoy)
            var nombreGrupo = document["responsable"]["empresa_grupo"].AsString;
            var subject = $"🔔 Nuevo Relevamiento: {nombreGrupo}";
            var to = new EmailAddress("agente@cardinal.com", "Consultor Cardinal");
            
            var plainTextContent = $"Se ha cargado un nuevo relevamiento para {nombreGrupo}. Revisalo en el Dashboard.";
            
            var htmlContent = $@"
                <div style='font-family: Arial, sans-serif; border: 1px solid #e0e0e0; padding: 25px; border-radius: 8px; max-width: 600px;'>
                    <h2 style='color: #1a237e;'>Gestión de Delivery</h2>
                    <p>Hola, se ha recibido una nueva configuración técnica para el cliente:</p>
                    <p style='font-size: 1.2em;'><strong>{nombreGrupo}</strong></p>
                    <p>Cargado por: {document["responsable"]["nombre"]} {document["responsable"]["apellido"]}</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
                    <p>Para ver los detalles completos, liquidaciones seleccionadas y archivos adjuntos, ingresá al portal:</p>
                    <a href='http://localhost:5500/dashboard.html' 
                       style='background-color: #1a237e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; display: inline-block;'>
                        Ir al Dashboard
                    </a>
                    <p style='margin-top: 25px; font-size: 0.85em; color: #777;'>Arquitectura Humanage - Rebori Marcelo</p>
                </div>";

            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
            await sendGridClient.SendEmailAsync(msg);
        }

        return Results.Ok(new { mensaje = "Éxito: Registro guardado y aviso enviado." });
    }
    catch (Exception ex) {
        Console.WriteLine($"Error en POST: {ex.Message}");
        return Results.Problem("Falla en el flujo de entrada: " + ex.Message);
    }
});

// --- 2. ENDPOINT PARA EL DASHBOARD (LECTURA) ---
app.MapGet("/api/relevamiento", async () => {
    try {
        var collection = database.GetCollection<BsonDocument>("Relevamientos");
        var documentos = await collection.Find(new BsonDocument()).ToListAsync();

        var settings = new JsonWriterSettings { OutputMode = JsonOutputMode.RelaxedExtendedJson };
        var listaFormateada = documentos.Select(doc => {
            var json = doc.ToJson(settings);
            return System.Text.Json.JsonSerializer.Deserialize<object>(json);
        });

        return Results.Ok(listaFormateada);
    }
    catch (Exception ex) {
        Console.WriteLine($"Error en GET Dashboard: {ex.Message}");
        return Results.Problem("Error al obtener datos: " + ex.Message);
    }
});

// --- 3. ENDPOINT DE LOGIN (SEGURIDAD) ---
app.MapPost("/api/login", async (HttpContext context) => {
    try {
        var collection = database.GetCollection<BsonDocument>("Agentes");

        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();
        var datosLogin = BsonDocument.Parse(body);

        string usuarioEntrante = datosLogin["usuario"].AsString;
        string passwordEntrante = datosLogin["password"].AsString;

        var filtro = Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("usuario", usuarioEntrante),
            Builders<BsonDocument>.Filter.Eq("password", passwordEntrante)
        );

        var agente = await collection.Find(filtro).FirstOrDefaultAsync();

        if (agente != null) {
            return Results.Ok(new { 
                mensaje = "Acceso concedido", 
                nombre = agente.Contains("nombre") ? agente["nombre"].AsString : "Usuario",
                rol = agente.Contains("rol") ? agente["rol"].AsString : "Agente"
            });
        } else {
            return Results.Json(new { mensaje = "Usuario o clave incorrectos" }, statusCode: 401);
        }
    }
    catch (Exception ex) {
        Console.WriteLine($"Error en Login: {ex.Message}");
        return Results.Problem("Error en validación de seguridad: " + ex.Message);
    }
});

app.Run();