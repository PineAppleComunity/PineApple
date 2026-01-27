var builder = WebApplication.CreateBuilder(args);

// Habilitar CORS para que GitHub Pages pueda entrar al club
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors();

// Endpoint de prueba para saber que el club está abierto
app.MapGet("/", () => new { mensaje = "PineApple Online - Bienvenido Vans", estado = "Operativo" });

// Endpoint de Login (Estructura base)
app.MapPost("/api/login", () => Results.Ok(new { mensaje = "Login listo para configurar" }));

app.Run();