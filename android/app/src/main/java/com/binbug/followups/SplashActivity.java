package com.binbug.followups;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

import com.airbnb.lottie.LottieAnimationView;

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.splash_activity);

        LottieAnimationView animationView = findViewById(R.id.splashAnimation);

        // Play animation and listen for end
        animationView.playAnimation();
        animationView.addAnimatorListener(new android.animation.Animator.AnimatorListener() {
            @Override
            public void onAnimationStart(android.animation.Animator animator) { }

            @Override
            public void onAnimationEnd(android.animation.Animator animator) {
                // Go to main Capacitor activity
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                startActivity(intent);
                finish();
            }

            @Override
            public void onAnimationCancel(android.animation.Animator animator) { }

            @Override
            public void onAnimationRepeat(android.animation.Animator animator) { }
        });
    }
}
