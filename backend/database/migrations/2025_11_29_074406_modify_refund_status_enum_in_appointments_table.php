<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL: ENUM columns are natively supported, no migration needed
        // For SQL Server: Would need to drop check constraint
        // Since we're on MySQL now, this migration is a no-op
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Nothing to do - SQL Server doesn't use ENUM
    }
};
