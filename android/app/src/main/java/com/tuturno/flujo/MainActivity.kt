package com.tuturno.flujo
import android.os.Bundle
import android.graphics.Color
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
class MainActivity : ReactActivity() {
 override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  // Configurar también Android anteriores a 15; React Native aplica los márgenes al contenido.
  enableEdgeToEdge(
   statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
   navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
  )
 }
 override fun getMainComponentName(): String = "TuTurno"
 override fun createReactActivityDelegate(): ReactActivityDelegate = object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
  override fun getLaunchOptions(): Bundle = Bundle().apply {
   intent.getStringExtra("screen")?.let { putString("screen", it) }
   intent.getStringExtra("variant")?.let { putString("variant", it) }
  }
 }
}
