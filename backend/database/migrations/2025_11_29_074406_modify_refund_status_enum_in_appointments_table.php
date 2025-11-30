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
        // For SQL Server, we just use VARCHAR since it doesn't support ENUM
        // Laravel already uses VARCHAR for enum on SQL Server, but we need to ensure the column exists
        // If it's already varchar, this should work. If not, we need to handle it differently.
        
        // First check if the column exists and its type
        // Since SQL Server doesn't have ENUM, Laravel stores it as varchar/nvarchar
        // We just need to ensure the check constraint allows the new values
        
        // Drop the old check constraint if it exists
        DB::unprepared("
            IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_appointments_refund_status')
            BEGIN
                ALTER TABLE appointments DROP CONSTRAINT CK_appointments_refund_status
            END
        ");
        
        // Add a new check constraint with updated values (optional, as Laravel doesn't always add these)
        // But since we're using a VARCHAR field, validation happens at the application level
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Nothing to do - SQL Server doesn't use ENUM
    }
};
