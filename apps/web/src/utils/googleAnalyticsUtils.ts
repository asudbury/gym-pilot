declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const isLocalhost = window.location.hostname === 'localhost';

function event(
  name: string,
  params?: Record<string, string | number | boolean>
) {
  if (isLocalhost) {
    return;
  }

  window.gtag?.('event', name, params);
}

export const googleAnalytics = {
  login(userId: string) {
    if (isLocalhost) return;

    window.gtag?.('set', {
      user_id: userId,
    });

    event('login');
  },

  favouritesClicked() {
    event('favourites_clicked');
  },

  plansClicked() {
    event('plans_clicked');
  },

  assignmentsClicked() {
    event('assignments_clicked');
  },

  adminClicked() {
    event('admin_clicked');
  },

  helpClicked() {
    event('help_clicked');
  },

  createWorkout(workoutId: string) {
    event('create_workout', {
      workout_id: workoutId,
    });
  },

  startWorkout(workoutId: string) {
    event('start_workout', {
      workout_id: workoutId,
    });
  },

  completeWorkout(workoutId: string, durationMinutes: number) {
    event('complete_workout', {
      workout_id: workoutId,
      duration_minutes: durationMinutes,
    });
  },

  addExercise(exerciseId: string) {
    event('add_exercise', {
      exercise_id: exerciseId,
    });
  },

  viewProgress() {
    event('view_progress');
  },

  exportPlan(format: string) {
    event('export_plan', {
      format,
    });
  },
};