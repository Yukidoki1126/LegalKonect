<?php

namespace App\Observers;

use App\Models\Lawyer;

class LawyerObserver
{
    /**
     * Handle the Lawyer "created" event.
     */
    public function created(Lawyer $lawyer): void
    {
        $this->syncUserName($lawyer);
    }

    /**
     * Handle the Lawyer "updated" event.
     */
    public function updated(Lawyer $lawyer): void
    {
        $this->syncUserName($lawyer);
    }

    /**
     * Keep the related user's name in sync with the lawyer's first/last name.
     */
    protected function syncUserName(Lawyer $lawyer): void
    {
        try {
            if ($lawyer->user) {
                $fullName = trim(($lawyer->first_name ?? '') . ' ' . ($lawyer->last_name ?? ''));
                if (!empty($fullName) && $lawyer->user->name !== $fullName) {
                    $lawyer->user->name = $fullName;
                    $lawyer->user->save();
                }
            }
        } catch (\Exception $e) {
            \Log::warning('LawyerObserver: failed to sync user.name', ['lawyer_id' => $lawyer->id, 'error' => $e->getMessage()]);
        }
    }
}
