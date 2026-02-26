CREATE TABLE [Users] (
    [Id] uniqueidentifier NOT NULL PRIMARY KEY,
    [Name] nvarchar(150) NOT NULL,
    [Email] nvarchar(200) NOT NULL
);

CREATE TABLE [Clients] (
    [Id] uniqueidentifier NOT NULL PRIMARY KEY,
    [UserId] uniqueidentifier NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [Email] nvarchar(200) NOT NULL,
    [Phone] nvarchar(60) NOT NULL,
    [Program] nvarchar(200) NOT NULL,
    [AvatarColor] nvarchar(20) NOT NULL,
    [StartDate] date NOT NULL,
    [Status] int NOT NULL,
    [Notes] nvarchar(max) NULL,
    CONSTRAINT [FK_Clients_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]) ON DELETE CASCADE
);

CREATE TABLE [Sessions] (
    [Id] uniqueidentifier NOT NULL PRIMARY KEY,
    [ClientId] uniqueidentifier NOT NULL,
    [Date] datetimeoffset NOT NULL,
    [Duration] int NOT NULL,
    [Location] int NOT NULL,
    [Status] int NOT NULL,
    [SessionType] nvarchar(150) NOT NULL,
    [Focus] nvarchar(500) NOT NULL,
    [Payment] nvarchar(50) NOT NULL,
    [PaymentStatus] nvarchar(max) NULL,
    [BillingSource] nvarchar(max) NULL,
    [PackageRemaining] int NULL,
    [Notes] nvarchar(max) NULL,
    CONSTRAINT [FK_Sessions_Clients_ClientId] FOREIGN KEY ([ClientId]) REFERENCES [Clients]([Id]) ON DELETE CASCADE
);
