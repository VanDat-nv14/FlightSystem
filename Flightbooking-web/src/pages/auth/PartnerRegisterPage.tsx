import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, MapPin, User, Mail, Lock, Phone, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '../../services/auth.service';

export default function PartnerRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    airlineName: '',
    airlineCode: '',
    country: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleNextStep = () => {
    // Basic validation for Step 1
    if (!formData.airlineName || !formData.airlineCode || !formData.country) {
      setError('Vui lòng điền đầy đủ thông tin Hãng bay.');
      return;
    }
    if (formData.airlineCode.length > 5) {
      setError('Mã Hãng bay (IATA/ICAO) tối đa 5 ký tự.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      handleNextStep();
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await authService.registerPartner({
        airlineName: formData.airlineName,
        airlineCode: formData.airlineCode,
        country: formData.country,
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card w-full max-w-md rounded-2xl shadow-xl border p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Đăng ký thành công!</h2>
            <p className="text-muted-foreground text-sm">
              Hồ sơ hãng bay <strong className="text-foreground">{formData.airlineName}</strong> đã được gửi đến Ban Quản Trị.
            </p>
          </div>
          <div className="bg-muted p-4 rounded-lg text-sm text-left space-y-2">
            <p><strong>Bước tiếp theo:</strong></p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Hệ thống đang xác minh thông tin hãng bay của bạn.</li>
              <li>Quá trình này có thể mất từ 1-2 ngày làm việc.</li>
              <li>Chúng tôi sẽ gửi thông báo qua email <strong>{formData.email}</strong> khi tài khoản được kích hoạt.</li>
            </ul>
          </div>
          <Button className="w-full" onClick={() => navigate('/login')}>
            Trở về trang Đăng nhập
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <Link to="/" className="absolute top-8 left-8 text-2xl font-black text-primary flex items-center gap-2 hover:opacity-90 transition-opacity">
        <PlaneIcon className="w-8 h-8" /> SKYBOOK
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card w-full max-w-[500px] rounded-2xl shadow-xl border overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Đăng ký Đối tác Hãng bay</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Tham gia mạng lưới SKYBOOK để mở rộng kênh phân phối vé.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}>
              1
            </div>
            <div className={`w-16 h-1 mx-2 rounded-full ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              2
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2 mb-4">
                        <Building2 className="w-5 h-5 text-primary" /> Thông tin Hãng hàng không
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="airlineName">Tên Hãng bay</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="airlineName" name="airlineName" placeholder="Ví dụ: Vietnam Airlines" className="pl-9" value={formData.airlineName} onChange={handleChange} autoFocus />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="airlineCode">Mã Hãng (IATA/ICAO)</Label>
                        <Input id="airlineCode" name="airlineCode" placeholder="Ví dụ: VN, VJ, QH" value={formData.airlineCode} onChange={handleChange} className="uppercase" maxLength={5} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Quốc gia</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="country" name="country" placeholder="Ví dụ: Việt Nam" className="pl-9" value={formData.country} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2 mb-4">
                        <User className="w-5 h-5 text-primary" /> Thông tin Người đại diện
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Họ và tên</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="fullName" name="fullName" placeholder="Họ tên người quản lý" className="pl-9" value={formData.fullName} onChange={handleChange} autoFocus />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email công việc</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="email" name="email" type="email" placeholder="email@airline.com" className="pl-9" value={formData.email} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Số điện thoại</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="0987..." className="pl-9" value={formData.phoneNumber} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Mật khẩu</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="password" name="password" type="password" placeholder="Tạo mật khẩu" className="pl-9" value={formData.password} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" className="pl-9" value={formData.confirmPassword} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              {step === 2 && (
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </Button>
              )}
              <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
                {step === 1 ? (
                  <>Tiếp tục <ArrowRight className="w-4 h-4" /></>
                ) : isSubmitting ? (
                  'Đang xử lý...'
                ) : (
                  <>Hoàn tất đăng ký <CheckCircle2 className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          </form>
        </div>
        <div className="bg-muted/50 p-4 text-center text-sm border-t">
          Đã là đối tác?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Đăng nhập ngay
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// Inline Plane icon for the logo
function PlaneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5-3 3-3-1-2 1 4 4 1-2-1-3 3-3 5 6 1.2-.7c.4-.2.7-.6.6-1.1z" />
    </svg>
  )
}
