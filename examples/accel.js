// The SparkFun breakout board defaults to 1, set to 0 if SA0 jumper on the bottom of the board is set
var MMA8452_ADDRESS = 0x1D  // 0x1D if SA0 is high, 0x1C if low

// Sets full-scale range to +/-2, 4, or 8g. Used to calc real g values.
var GSCALE = 2

// See the many application notes for more info on setting all of these registers:
// http://www.freescale.com/webapp/sps/site/prod_summary.jsp?code=MMA8452Q
// MMA8452 registers
var OUT_X_MSB = 0x01
var XYZ_DATA_CFG = 0x0E
var WHO_AM_I = 0x0D
var CTRL_REG1 = 0x2A

function mma8452_read_registers (addressToRead, bytesToRead)
{
  return _tm.i2c_master_request_blocking(_tm.I2C_1, MMA8452_ADDRESS, [addressToRead], bytesToRead);
}

function mma8452_read_register (addressToRead)
{
  return mma8452_read_registers(addressToRead, 1)[0];
}

// Write a single byte to the register.

function mma8452_write_register (addressToWrite, dataToWrite)
{
  _tm.i2c_master_send_blocking(_tm.I2C_1, MMA8452_ADDRESS, [addressToWrite, dataToWrite]);
}


// Sets the MMA8452 to standby mode. It must be in standby to change most register settings
function mma8452_mode_standby ()
{
  var c = mma8452_read_register(CTRL_REG1);
  mma8452_write_register(CTRL_REG1, (c >> 1) << 1); //Clear the active bit to go into standby
}

// Sets the MMA8452 to active mode. Needs to be in this mode to output data
function mma8452_mode_active()
{
  var c = mma8452_read_register(CTRL_REG1);
  mma8452_write_register(CTRL_REG1, c | 0x01); //Set the active bit to begin detection
}

function mma8452_accel_read ()
{
  var rawData = mma8452_read_registers(OUT_X_MSB, 6);  // Read the six raw data registers into data array
  return [0, 0, 0];
}

//   console.log('rawdata', rawData);

//   // Loop to calculate 12-bit ADC and g value for each axis
//   var out = [];
//   for (var i = 0; i < 3 ; i++) {
//     console.log('i*2', i*2, rawData.length);
//     var gCount = (rawData[i*2] << 8) | rawData[(i*2)+1];  //Combine the two 8 bit registers into one 12-bit number
//     gCount >>= 4; //The registers are left align, here we right align the 12-bit integer

//     // If the number is negative, we have to make it so manually (no 12-bit data type)
//     if (rawData[i*2] > 0x7F) {
//       gCount = ~gCount + 1;
//       gCount *= -1;  // Transform into negative 2's complement #
//     }

//     out[i] = gCount / ((1<<12)/(2*GSCALE));
//   }
//   return out;
// }

function mma8452_initialize ()
{
  var c = mma8452_read_register(WHO_AM_I);  // Read WHO_AM_I register
  if (c == 0x2A) { // WHO_AM_I should always return 0x2A
    console.log("MMA8452Q is online...");
  } else {
    console.log("Could not connect to MMA8452Q:", c);
    while (1) { continue; } // Loop forever if communication doesn't happen
  }

  mma8452_mode_standby();  // Must be in standby to change registers

  // Set up the full scale range to 2, 4, or 8g.
  var fsr = GSCALE;
  if (fsr > 8) fsr = 8; //Easy error check
  fsr >>= 2; // Neat trick, see page 22. 00 = 2G, 01 = 4A, 10 = 8G
  mma8452_write_register(XYZ_DATA_CFG, fsr);

  // The default data rate is 800Hz and we don't modify it in this example code
  mma8452_mode_active();  // Set to active to start reading
}

_tm.i2c_initialize(null, _tm.I2C_1);
_tm.i2c_master_enable(null, _tm.I2C_1);

mma8452_initialize();
while (1) {
  var accel = mma8452_accel_read();  // Read the x/y/z adc values
  console.log("x:", accel[0], "y:", accel[1], "z:", accel[2]);
  _tm.sleep_ms(10000);
}