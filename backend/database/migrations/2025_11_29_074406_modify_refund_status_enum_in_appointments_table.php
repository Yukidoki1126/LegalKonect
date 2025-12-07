<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // MySQL doesn't need any changes for ENUM modifications
        // Laravel handles ENUM at the application level for MySQL
        // No database-level constraint changes needed
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Nothing to do - SQL Server doesn't use ENUM
    }
};
