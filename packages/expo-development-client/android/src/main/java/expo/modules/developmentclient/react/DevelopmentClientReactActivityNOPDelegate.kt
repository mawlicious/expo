package expo.modules.developmentclient.react

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate

open class DevelopmentClientReactActivityNOPDelegate(activity: ReactActivity)
  : ReactActivityDelegate(activity, null) {

  override fun onCreate(savedInstanceState: Bundle?) {}
  override fun onResume() {}
  override fun onPause() {}
  override fun onDestroy() {}
  override fun onNewIntent(intent: Intent?): Boolean = true
  override fun onBackPressed(): Boolean = true
  override fun onWindowFocusChanged(hasFocus: Boolean) {}
  override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>?, grantResults: IntArray?) {}
}
