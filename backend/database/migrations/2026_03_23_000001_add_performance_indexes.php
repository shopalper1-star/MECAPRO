<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->index(['preferred_date', 'appointment_time', 'status'], 'appointments_date_time_status_idx');
            $table->index(['user_id', 'created_at'], 'appointments_user_created_idx');
            $table->index(['status'], 'appointments_status_idx');
        });

        Schema::table('repairs', function (Blueprint $table) {
            $table->index(['mechanic_id', 'date_entry', 'status'], 'repairs_mechanic_date_status_idx');
            $table->index(['date_end', 'status'], 'repairs_dateend_status_idx');
            $table->index(['status'], 'repairs_status_idx');
            $table->index(['created_at'], 'repairs_created_at_idx');
            $table->index(['vehicle_id', 'created_at'], 'repairs_vehicle_created_idx');
        });

        Schema::table('part_requests', function (Blueprint $table) {
            $table->index(['mechanic_id', 'created_at'], 'part_requests_mechanic_created_idx');
            $table->index(['status'], 'part_requests_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('appointments_date_time_status_idx');
            $table->dropIndex('appointments_user_created_idx');
            $table->dropIndex('appointments_status_idx');
        });

        Schema::table('repairs', function (Blueprint $table) {
            $table->dropIndex('repairs_mechanic_date_status_idx');
            $table->dropIndex('repairs_dateend_status_idx');
            $table->dropIndex('repairs_status_idx');
            $table->dropIndex('repairs_created_at_idx');
            $table->dropIndex('repairs_vehicle_created_idx');
        });

        Schema::table('part_requests', function (Blueprint $table) {
            $table->dropIndex('part_requests_mechanic_created_idx');
            $table->dropIndex('part_requests_status_idx');
        });
    }
};
