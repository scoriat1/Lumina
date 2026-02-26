#!/usr/bin/env bash
set -euo pipefail

SQLCMD_BIN=${SQLCMD_BIN:-sqlcmd}
CONN=${LUMINA_SQL_CONN:--S .\\SQLEXPRESS -E}

$SQLCMD_BIN $CONN -Q "IF DB_ID('LuminaDb') IS NOT NULL ALTER DATABASE LuminaDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE; IF DB_ID('LuminaDb') IS NOT NULL DROP DATABASE LuminaDb; CREATE DATABASE LuminaDb;"
$SQLCMD_BIN $CONN -d LuminaDb -i src/Lumina.Infrastructure/Data/Migrations/0001_Initial.sql

echo "LuminaDb reset complete."
