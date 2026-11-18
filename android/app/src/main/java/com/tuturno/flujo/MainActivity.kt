package com.tuturno.flujo
import android.os.Bundle
import android.graphics.Color
import android.os.Build
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
class MainActivity : ReactActivity() {
 override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  // Configurar también Android anteriores a 15; React Native aplica los márgenes al contenido.
  WindowCompat.setDecorFitsSystemWindows(window, false)
  @Suppress("DEPRECATION")
  window.statusBarColor = Color.TRANSPARENT
  @Suppress("DEPRECATION")
  window.navigationBarColor = Color.TRANSPARENT
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
   window.isStatusBarContrastEnforced = false
   window.isNavigationBarContrastEnforced = false
  }
  WindowCompat.getInsetsController(window, window.decorView).apply {
   isAppearanceLightStatusBars = false
   isAppearanceLightNavigationBars = false
  }
 }
 override fun getMainComponentName(): String = "TuTurno"
 override fun createReactActivityDelegate(): ReactActivityDelegate = object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
  override fun getLaunchOptions(): Bundle = Bundle().apply {
   intent.getStringExtra("screen")?.let { putString("screen", it) }
   intent.getStringExtra("variant")?.let { putString("variant", it) }
  }
 }
}
