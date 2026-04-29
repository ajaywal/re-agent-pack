using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using TrackAllLoanMaintenanceLegacy.Application.Commands;
using TrackAllLoanMaintenanceLegacy.Application.Queries;
using TrackAllLoanMaintenanceLegacy.Domain.Ports;
using TrackAllLoanMaintenanceLegacy.Domain.Repositories;
using TrackAllLoanMaintenanceLegacy.Infrastructure.ExternalServices;
using TrackAllLoanMaintenanceLegacy.Infrastructure.Persistence;
using TrackAllLoanMaintenanceLegacy.Infrastructure.Repositories;

// DI wiring — TrackAllLoanMaintenanceLegacy — Angular web UI / .NET Core REST APIs / Azure SQL
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TrackAll Loan Maintenance API",
        Version = "v1",
        Description = "UI-facing Presentation API for loan search, add, modify, quote processing, and 14E notification dispatch. Controllers delegate to Application command/query handlers; UI teams should integrate with these /api endpoints."
    });
    options.SupportNonNullableReferenceTypes();
});

// Infrastructure — Database (SQLite for local dev; swap for Azure SQL in production)
builder.Services.AddDbContext<TrackAllLoanMaintenanceLegacyDbContext>(options =>
    options.UseSqlite("Data Source=track_all_loan_maintenance_legacy.db"));

// Application — handlers (one registration per Command/Query handler)
builder.Services.AddScoped<SearchLoansQueryHandler>();
builder.Services.AddScoped<GetLoanByIdQueryHandler>();
builder.Services.AddScoped<CreateLoanCommandHandler>();
builder.Services.AddScoped<UpdateLoanCommandHandler>();
builder.Services.AddScoped<ProcessLoanResultCommandHandler>();
builder.Services.AddScoped<Dispatch14ENotificationCommandHandler>();

// Infrastructure — Repository implementations (interfaces from Domain.Repositories)
builder.Services.AddScoped<ILoanRepository, LoanRepository>();
builder.Services.AddScoped<ILoanAuditRepository, LoanAuditRepository>();

// Infrastructure — Port implementations (interfaces from Domain.Ports)
builder.Services.AddScoped<IRataBaseServiceAdapter, RataBaseServiceAdapter>();
builder.Services.AddScoped<IKentuckyIsoAdapter, KentuckyIsoAdapter>();
builder.Services.AddScoped<IEDINotificationAdapter, EDINotificationAdapter>();

builder.Services.AddCors(opts => opts.AddDefaultPolicy(p =>
    p.WithOrigins(
            "http://localhost:4200",
            "http://127.0.0.1:4200",
            "http://localhost:4300",
            "http://127.0.0.1:4300")
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();
using (var scope = app.Services.CreateScope())
    await TrackAllLoanMaintenanceLegacyDbSeeder.SeedAsync(scope.ServiceProvider);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.Run();
