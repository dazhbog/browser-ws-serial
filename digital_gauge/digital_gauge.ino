#define data_line_pin  2
#define clock_line_pin 3
#define debug_pin      21
#define debug_pin2     20
#define btn            18
#define REC_MEASUREMENT         18
#define NEW_PART_MEASUREMENT    19
#define BUZZER_PIN     17
#define POL RISING
#define TEST_MODE   0
#define DELAY_US(A)  do{ delayMicroseconds(A);}while(0) 

#define PO(PINY, STATY)  do{ digitalWrite(PINY, STATY); pinMode(PINY, OUTPUT); digitalWrite(PINY, STATY); }while(0)
#define PL(PINY)         do{ PO(PINY, LOW);  }while(0)
#define PH(PINY)         do{ PO(PINY, HIGH); }while(0)
#define PIA(PINY)        do{ pinMode(PINY, INPUT_ANALOG); }while(0)
//#define PI(PINY)        // PI 3.14 <----
#define PINI(PINY)        do{ pinMode(PINY, INPUT); }while(0)
#define PINP(PINY)        do{ pinMode(PINY, INPUT_PULLUP); }while(0) // obsolete
#define PINPU(PINY)       do{ pinMode(PINY, INPUT_PULLUP); }while(0)
#define PINPD(PINY)       do{ pinMode(PINY, INPUT_PULLUP); }while(0)

volatile uint8_t transition_count = 0, acc = 0, data_pending = 0, buf_idx=0, error = 0, pinState = 0, wait_for_slot = 0, fresh_pulse=0, randomy_count=0;
volatile uint8_t buf[7] = {0}, rec_btn_pressed=0, new_btn_pressed=0, rec_btn_last_pressed = 0, new_btn_last_pressed = 0;

volatile uint32_t last_millis, diff_millis;

void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(LED_BUILTIN, OUTPUT);
    pinMode(debug_pin, OUTPUT);
    pinMode(debug_pin2, OUTPUT);
  pinMode(data_line_pin,  INPUT_PULLUP);
  pinMode(clock_line_pin, INPUT_PULLUP);
  pinMode(REC_MEASUREMENT, INPUT_PULLUP);
  pinMode(NEW_PART_MEASUREMENT, INPUT_PULLUP);
  
  //attachInterrupt(clock_line_pin, clock_in_isr, FALLING);
  attachInterrupt(digitalPinToInterrupt(clock_line_pin), clock_in_isr, POL);
  attachInterrupt(digitalPinToInterrupt(REC_MEASUREMENT), rec_press_isr, FALLING);
  attachInterrupt(digitalPinToInterrupt(NEW_PART_MEASUREMENT), new_press_isr, FALLING);
  //attachInterrupt(digitalPinToInterrupt(data_line_pin), data_start_isr, FALLING);
  Serial.begin(38400);
  digitalWrite(debug_pin2, LOW); 
  beep();
  //Serial.println("Hello");
}

// the loop function runs over and over again forever
void loop() {

  /*
  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(1000);                       // wait for a second
  digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
  delay(1000);                       // wait for a second
  */
        /*Serial.print(buf[0], HEX);
        Serial.print(buf[1], HEX);
        Serial.print(buf[2], HEX);
        Serial.print(buf[3], HEX);
        Serial.print(buf[4], HEX);
        Serial.print(buf[5], HEX);*/

if (TEST_MODE){
    if (randomy_count<90)
        randomy_count+=10;
    else
        randomy_count = 0;
    if (randomy_count < 30)
        Serial.print("{\"MM\":\"3.11\"");
    else if (randomy_count <60){
        Serial.print("{\"MM\":\"3.12\"");
    } else { //if (randomy_count <90){
        Serial.print("{\"MM\":\"3.10\"");
    }
    Serial.print(", \"REC\":");
    Serial.print(rec_btn_pressed);
    Serial.print(", \"NEW\":");
    Serial.print(new_btn_pressed);
    Serial.println("}");
    rec_btn_pressed = new_btn_pressed = 0;
    delay(500);
    return;
}

    if ((data_pending)&&(buf[0] == 0)&&(buf[5] == 0)){
        digitalWrite(debug_pin2, HIGH); 
        
        Serial.print("{\"MM\":\"");
        Serial.print(buf[5], HEX);
        Serial.print(buf[4], HEX);
        Serial.print(buf[3], HEX);
        Serial.print(".");
        Serial.print(buf[2], HEX);
        Serial.print(buf[1], HEX);
        Serial.print(buf[0], HEX);
        Serial.print("\"");
        Serial.print(", \"REC\":");
        Serial.print(rec_btn_pressed);
        Serial.print(", \"NEW\":");
        Serial.print(new_btn_pressed);
        //Serial.print(", ERR:");
        //Serial.print(error);
        Serial.println("}");

        //Serial.println(error);
        //error = 0;
        data_pending = 0;
        rec_btn_pressed = new_btn_pressed = 0;
        
        //wait_for_slot = 1;
        //last_millis = 0;
        delay(120);
        memset(buf, 0, 7);
        last_millis = millis();
        attachInterrupt(digitalPinToInterrupt(clock_line_pin), clock_in_isr, POL);
        digitalWrite(debug_pin2, LOW); 
    }
}




void rec_press_isr(){
    if ((rec_btn_last_pressed == 0)||(millis() - rec_btn_last_pressed > 250)){
        rec_btn_pressed = 1;
        beep();
    }
    rec_btn_last_pressed = millis();
}

void new_press_isr(){
    if ((new_btn_last_pressed == 0)||(millis() - new_btn_last_pressed > 250)){
        new_btn_pressed = 1;
        beep();
    }
    new_btn_last_pressed = millis();
}

void clock_in_isr(){
    digitalWrite(debug_pin, LOW); 
    digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
    diff_millis = millis() - last_millis;
    
    /*if (last_millis != 0){
        
        
    } else {
        last_millis = millis();
        return;
    }*/
    
    if (diff_millis > 1){
       // data_pending = error = 0;
        transition_count = buf_idx = 0;
        acc = 0;
        //wait_for_slot = 0;
    } /*else if (wait_for_slot){
        return;
    }*/
    if ((transition_count == 0)&&(buf_idx == 0)&&(digitalRead(data_line_pin) == 1)){ // rogue pulse
            transition_count = buf_idx = 0;
            acc = 0;
            digitalWrite(debug_pin, HIGH); 
            return;
    }


/*
    if (data_pending){
        error++;
        //transition_count = buf_idx = 0;
        return;
    }
*/
    //for(uint8_t i=0;i<100;i++);

    
    
    //pinState += digitalRead(data_line_pin);
    /*asm volatile("nop");
    asm volatile("nop");
    asm volatile("nop");
    pinState += digitalRead(data_line_pin);
*/

    for(uint8_t i=0;i<10;i++);
    if (digitalRead(data_line_pin)){
        
        acc |= (1 << transition_count);
        
    }else{ // else clause added to ensure function timing is ~balanced
        //digitalWrite(debug_pin, LOW); 
        acc &= ~(1 << transition_count); // 1110
    }
    //pinState = 0;
    //asm volatile("nop"); //tune a bit? verify on scope
    //acc = (acc << 1) & 0x0F;


    transition_count++;
    if (transition_count >= 4){
        transition_count = 0;

        buf[buf_idx] = acc;
        acc = 0;
        buf_idx++;

        if (buf_idx >= 7){
            detachInterrupt(digitalPinToInterrupt(clock_line_pin));
            buf_idx = 0;
            data_pending = 1;   
            
            delay(1);
        }
        
            
    }



    digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
    digitalWrite(debug_pin, HIGH); 
    last_millis = millis();
    
}


 volatile long g,state=0;

void toggle_buzzer_pin(){
    state = 1 - state;
    //digitalWrite(BUZZER_PIN, state);
    PO(BUZZER_PIN, state);
}
void set_idle_buzzer_pin(){
    PINI(BUZZER_PIN);
    //PO(BUZZER_PIN, BUZZER_IDLE_STATE);
}
void beep(){

    for (g=0;g<60;g++){ 
        DELAY_US(130);//d(26);//for(i=0;i<26;i++) ;                         
        toggle_buzzer_pin();
    }
    for (g=0;g<40;g++){ 
        DELAY_US(100);//d(21);//21                            
        toggle_buzzer_pin();
    }
    set_idle_buzzer_pin(); // important to be before vib delay

}


