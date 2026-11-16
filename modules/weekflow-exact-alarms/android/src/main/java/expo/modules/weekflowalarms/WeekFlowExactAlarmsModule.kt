package expo.modules.weekflowalarms

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Only reports Android's actual special-access state. This does not schedule
 * alarms, grant a permission, change battery policy or alter saved reminders.
 */
class WeekFlowExactAlarmsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("WeekFlowExactAlarms")

    AsyncFunction<Boolean>("canScheduleExactAlarmsAsync") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        true
      } else {
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        manager.canScheduleExactAlarms()
      }
    }

    AsyncFunction<String>("openExactAlarmSettingsAsync") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return@AsyncFunction "not-needed"
      }
      val appUri = Uri.parse("package:${context.packageName}")
      val exactIntent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, appUri).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      try {
        context.startActivity(exactIntent)
        "exact"
      } catch (_: Exception) {
        // Some manufacturer builds do not expose a direct alarm settings page.
        try {
          val fallback = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, appUri).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(fallback)
          "app-details"
        } catch (_: Exception) {
          "unavailable"
        }
      }
    }
  }
}
