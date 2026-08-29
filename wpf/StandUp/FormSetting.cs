using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Diagnostics;

namespace StandUp
{
    public partial class FormSetting : Form
    {
        private const int TrackBarMinValue = 5;

        public int notifyMinutes = 45;
        public bool isDisableWhenFullscreen = false;

        Timer tickTimer = new Timer();

        public FormSetting()
        {
            InitializeComponent();
        }

        private void TickTimerProcessor(Object obj, EventArgs args)
        {
            if (isDisableWhenFullscreen && IsForegroundFullScreen())
			{
                Debug.WriteLine("exist fullscreen program");
                return;
			}

            tickTimer.Stop();

            var frmTip = new FormTip(this);
            // frmTip.TopMost = true;
            frmTip.Show();
        }

        private int Minutes2Interval(int minutes)
		{
            return minutes * 60 * 1000;
        }

        private void FormSetting_Load(object sender, EventArgs e)
        {
            tickTimer.Tick += new EventHandler(TickTimerProcessor);

            tickTimer.Interval = Minutes2Interval(notifyMinutes);
            tickTimer.Start();

            trackBar1.Value = (int)Math.Floor(notifyMinutes * 1.0 / TrackBarMinValue);
        }

        private void FormSetting_SizeChanged(object sender, EventArgs e)
        {
            if (this.WindowState == FormWindowState.Normal)
            {
                notifyIcon1.Visible = true;
            }
            else if (this.WindowState == FormWindowState.Minimized)
            {
                this.Hide();
            }
        }

        private void notifyIcon1_MouseClick(object sender, MouseEventArgs e)
        {
            if (this.WindowState == FormWindowState.Minimized)
            {
                this.Show();
                this.WindowState = FormWindowState.Normal;
            }
        }

        private void trackBar1_ValueChanged(object sender, EventArgs e)
        {
            notifyMinutes = Math.Max(1, trackBar1.Value * TrackBarMinValue);

            tickTimer.Stop();
            tickTimer.Interval = Minutes2Interval(notifyMinutes);
            tickTimer.Enabled = true;
        }

        public void Resume()
        {
            tickTimer.Enabled = true;
        }

		private void disableFullscreenCheckBox_CheckedChanged(object sender, EventArgs e)
		{
            isDisableWhenFullscreen = !isDisableWhenFullscreen;
        }

        // https://stackoverflow.com/questions/3743956/is-there-a-way-to-check-to-see-if-another-program-is-running-full-screen
        [StructLayout(LayoutKind.Sequential)]
        private struct RECT
        {
            public int left;
            public int top;
            public int right;
            public int bottom;
        }

        [DllImport("user32.dll")]
        private static extern bool GetWindowRect(HandleRef hWnd, [In, Out] ref RECT rect);

        [DllImport("user32.dll")]
        private static extern IntPtr GetForegroundWindow();

        public static bool IsForegroundFullScreen()
        {
            return IsForegroundFullScreen(null);
        }

        public static bool IsForegroundFullScreen(Screen screen)
        {
            if (screen == null)
            {
                screen = Screen.PrimaryScreen;
            }
            RECT rect = new RECT();
            GetWindowRect(new HandleRef(null, GetForegroundWindow()), ref rect);
            return new Rectangle(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top).Contains(screen.Bounds);
        }
    }
}
