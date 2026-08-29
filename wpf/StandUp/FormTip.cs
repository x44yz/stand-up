using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace StandUp
{
    public partial class FormTip : Form
    {
        private const int PADDING_WIDTH = 20;
        private FormSetting frmSetting = null;

        public FormTip(FormSetting frm)
        {
            InitializeComponent();

            frmSetting = frm;
        }

        private void FormTip_Load(object sender, EventArgs e)
        {
            var screen = Screen.FromPoint(this.Location);
            this.Location = new Point(screen.WorkingArea.Right - this.Width - PADDING_WIDTH, screen.WorkingArea.Top + PADDING_WIDTH);

            this.label2.Text = "It's " + frmSetting.notifyMinutes.ToString() + " minutes past the hour";
        }

        private void button1_Click(object sender, EventArgs e)
        {
            this.Close();

            frmSetting.Resume();
        }
    }
}
