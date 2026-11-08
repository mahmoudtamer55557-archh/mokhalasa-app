import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def build_pitch_deck():
    prs = Presentation()
    # 16:9 Widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # blank

    # Color Palette
    C_NAVY = RGBColor(11, 45, 74)         # #0B2D4A
    C_DARK = RGBColor(7, 19, 36)          # #071324
    C_CARD = RGBColor(17, 34, 64)         # #112240
    C_EMERALD = RGBColor(16, 185, 129)    # #10B981
    C_GOLD = RGBColor(245, 158, 11)       # #F59E0B
    C_WHITE = RGBColor(255, 255, 255)
    C_MUTED = RGBColor(148, 163, 184)     # #94A3B8
    C_LIGHT_BG = RGBColor(248, 250, 252)

    def set_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = C_DARK
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text):
        # Category badge
        badge_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
        tf_b = badge_box.text_frame
        tf_b.word_wrap = True
        p_b = tf_b.paragraphs[0]
        p_b.text = f"• {category_text} •"
        p_b.font.size = Pt(11)
        p_b.font.bold = True
        p_b.font.color.rgb = C_EMERALD
        p_b.alignment = PP_ALIGN.RIGHT

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.7), Inches(0.8))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text
        p_t.font.size = Pt(24)
        p_t.font.bold = True
        p_t.font.color.rgb = C_WHITE
        p_t.alignment = PP_ALIGN.RIGHT

        # Top small brand logo/text
        brand_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(4.0), Inches(0.4))
        tf_br = brand_box.text_frame
        p_br = tf_br.paragraphs[0]
        p_br.text = "مُخَلّصة | Mokhalasa"
        p_br.font.size = Pt(12)
        p_br.font.bold = True
        p_br.font.color.rgb = C_MUTED
        p_br.alignment = PP_ALIGN.LEFT

    def add_card(slide, left, top, width, height, title, desc, icon="", accent=C_EMERALD):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD
        card.line.color.rgb = accent
        card.line.width = Pt(1.2)

        tx_box = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), width - Inches(0.4), height - Inches(0.4))
        tf = tx_box.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = f"{icon} {title}" if icon else title
        p1.font.size = Pt(15)
        p1.font.bold = True
        p1.font.color.rgb = C_WHITE
        p1.alignment = PP_ALIGN.RIGHT

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = C_MUTED
        p2.alignment = PP_ALIGN.RIGHT
        p2.space_before = Pt(8)

    # -------------------------------------------------------------
    # SLIDE 1: COVER
    # -------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    set_bg(s1)

    # Central Card
    c_box = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(1.2), Inches(10.33), Inches(5.1))
    c_box.fill.solid()
    c_box.fill.fore_color.rgb = C_NAVY
    c_box.line.color.rgb = C_EMERALD
    c_box.line.width = Pt(2.5)

    tf1 = c_box.text_frame
    tf1.word_wrap = True
    
    p = tf1.paragraphs[0]
    p.text = "مُخَلّصة • MOKHALASA"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p.alignment = PP_ALIGN.CENTER

    p = tf1.add_paragraph()
    p.text = "أول منصة ذكية لتسوية وفك حظر سيارات المديونيات البنكية والتقسيط المباشر الموثق في مصر"
    p.font.size = Pt(18)
    p.font.color.rgb = C_EMERALD
    p.alignment = PP_ALIGN.CENTER
    p.space_before = Pt(12)

    p = tf1.add_paragraph()
    p.text = "ملف العرض التقديمي ودراسة الجدوى | حاضنة الأعمال الجامعية 2026"
    p.font.size = Pt(13)
    p.font.color.rgb = C_MUTED
    p.alignment = PP_ALIGN.CENTER
    p.space_before = Pt(16)

    p = tf1.add_paragraph()
    p.text = "فريق التأسيس: محمود تامر وأخته (شريكان مؤسسان)  •  الموقع المباشر: https://mokalasa.online"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p.alignment = PP_ALIGN.CENTER
    p.space_before = Pt(28)

    # -------------------------------------------------------------
    # SLIDE 2: THE PROBLEM
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    set_bg(s2)
    add_header(s2, "المشكلة وأزمة سيارات المديونيات في السوق المصري", "واقع السوق والتحديات")

    col_w = Inches(3.6)
    row_h = Inches(4.8)
    add_card(s2, Inches(0.8), Inches(1.8), col_w, row_h, "1. تعثر أصحاب السيارات", 
             "بعد التضخم وتعويم الجنيه، آلاف المواطنين يعجزون عن سداد الأقساط البنكية الشهرية. وبسبب شرط حظر البيع البنكي لا يستطيع المالك بيع سيارته قانونياً، مما يهدده بمصادرة السيارة وتراكم فوائد التأخير والمساءلة القضائية.",
             "⚠️", C_GOLD)
    
    add_card(s2, Inches(4.85), Inches(1.8), col_w, row_h, "2. الخوف من القضايا الجنائية", 
             "لجوء المتعثرين إلى البيع العرفي أو التوكيلات غير الرسمية يوقع المشتري والبائع في فخ قضايا خيانة الأمانة وتبديد أموال البنك، مع حظر تجديد الرخصة في المرور واحتمالية ضياع أموال المشتري بالكامل.",
             "⚖️", C_GOLD)

    add_card(s2, Inches(8.9), Inches(1.8), col_w, row_h, "3. تعقيدات تمويل المستعمل", 
             "البنوك تضع شروطاً تعجيزية وإثباتات دخل معقدة وفائدة مرتفعة لشراء السيارات المستعملة، مما يحرم شريحة الشباب وأصحاب المهن الحرة من امتلاك سيارة بالتقسيط الميسر.",
             "🏦", C_GOLD)

    # -------------------------------------------------------------
    # SLIDE 3: THE SOLUTION
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    set_bg(s3)
    add_header(s3, "الحل والابتكار: منظومة منصة مخلصة المتكاملة", "الحل الرقمي والقانوني")

    w2 = Inches(5.6)
    h2 = Inches(2.3)
    add_card(s3, Inches(0.8), Inches(1.8), w2, h2, "سداد بنكي وفك حظر رسمي", 
             "تسوية المديونية مباشرة مع البنك أو شركة التمويل، واستخراج مخالصة رسمية وشهادة براءة ذمة، ورفع إشارة الحظر من المرور قبل نقل الملكية.", "📜", C_EMERALD)

    add_card(s3, Inches(6.8), Inches(1.8), w2, h2, "تقسيط مباشر بدون بنوك", 
             "نظام تقسيط مرن ومباشر بين البائع والمشتري مع صياغة وتوثيق العقود بالشهر العقاري وإصدار شيكات بنكية قانونية لضمان حقوق الطرفين.", "🤝", C_EMERALD)

    add_card(s3, Inches(0.8), Inches(4.4), w2, h2, "فحص فني واستعلام مروري وجنائي", 
             "تقرير فني معتمد للهيكل والمحرك مع كشف رسمي لجميع المخالفات المرورية والأحكام القضائية لضمان خلو المركبة من أي أعباء سابقة.", "🔍", C_EMERALD)

    add_card(s3, Inches(6.8), Inches(4.4), w2, h2, "نظام الضمان المالي المتبادل (Escrow)", 
             "حجز مبالغ الجدية ومستحقات التسوية في حساب مصرفي وسيط حتى إتمام الفحص واستلام المخالصة، لمنع النصب والتلاعب بنسبة 100%.", "🛡️", C_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 4: MARKET SIZE & OPPORTUNITY
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    set_bg(s4)
    add_header(s4, "حجم السوق والفرصة التنافسية في مصر", "الفرصة الاستثمارية")

    col_w3 = Inches(3.6)
    h3 = Inches(1.8)
    add_card(s4, Inches(0.8), Inches(1.8), col_w3, h3, "6.5 مليون سيارة", "حجم أسطول السيارات المرخصة في مصر مع زيادة الطلب على سوق المستعمل.", "🚗", C_EMERALD)
    add_card(s4, Inches(4.85), Inches(1.8), col_w3, h3, "350,000+ سيارة", "سيارة مقسطة بنكياً سنوياً، نسبة التعثر فيها تقدر بـ 8% إلى 12% سنوياً.", "📊", C_EMERALD)
    add_card(s4, Inches(8.9), Inches(1.8), col_w3, h3, "صفر منافس متخصص", "غياب تام لأي منصة تركز على تسوية وفك حظر سيارات المديونيات بنكياً وقانونياً.", "🏆", C_EMERALD)

    # Big Opportunity text card
    op_box = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(3.9), Inches(11.7), Inches(2.8))
    op_box.fill.solid()
    op_box.fill.fore_color.rgb = C_CARD
    op_box.line.color.rgb = C_EMERALD
    op_box.line.width = Pt(1.5)
    tf_op = op_box.text_frame
    tf_op.word_wrap = True

    p = tf_op.paragraphs[0]
    p.text = "🎯 لماذا الآن؟ (Market Timing):"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p.alignment = PP_ALIGN.RIGHT

    points = [
        "• الارتفاع القياسي في أسعار السيارات الزيرو وجه أكثر من 70% من المشترين نحو سوق المستعمل والحلول البديلة.",
        "• تشديد البنوك لنسب عبء الدين (DTI) ترك فجوة تمويلية ضخمة للباحثين عن تقسيط مباشر.",
        "• التحول الرقمي وإقبال المواطنين على منصات الخدمات القانونية والتكنولوجية الموثوقة."
    ]
    for pt in points:
        p = tf_op.add_paragraph()
        p.text = pt
        p.font.size = Pt(12.5)
        p.font.color.rgb = C_MUTED
        p.alignment = PP_ALIGN.RIGHT
        p.space_before = Pt(6)

    # -------------------------------------------------------------
    # SLIDE 5: BUSINESS MODEL
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    set_bg(s5)
    add_header(s5, "نموذج العمل ومصادر الإيرادات (Business Model)", "كيف نربح؟")

    w2 = Inches(5.6)
    h2 = Inches(2.3)
    add_card(s5, Inches(0.8), Inches(1.8), w2, h2, "1. عمولة الوساطة والتسوية", 
             "نسبة من 1.5% إلى 2.5% من إجمالي قيمة تسوية المديونية أو سعر بيع السيارة، يتم تحصيلها عند إتمام نقل الملكية وتسليم المخالصة الرسمية.", "💰", C_EMERALD)

    add_card(s5, Inches(6.8), Inches(1.8), w2, h2, "2. رسوم الفحص الفني والاستعلام", 
             "رسوم تتراوح بين 1,500 إلى 2,500 ج.م لكل تقرير فحص واستعلام أمني ومروري، يتم تنفيذه بالشراكة مع مراكز فحص معتمدة.", "📑", C_EMERALD)

    add_card(s5, Inches(0.8), Inches(4.4), w2, h2, "3. إدارة عقود التقسيط المباشر", 
             "رسوم تحصيل ومتابعة دورية للشيكات والأقساط الشهرية بين البائع والمشتري مع التوثيق العقاري، بنسبة 2% إلى 3% من المحفظة المدارة.", "💳", C_EMERALD)

    add_card(s5, Inches(6.8), Inches(4.4), w2, h2, "4. باقات الإعلانات وخدمات التأمين", 
             "باقات تمييز الإعلانات لمعارض وتجار السيارات (500 - 2,000 ج.م شهرياً)، بالإضافة لعمولات وثائق التأمين التكميلي والصيانة.", "⭐", C_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 6: FINANCIAL PROJECTIONS (3 YEARS)
    # -------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    set_bg(s6)
    add_header(s6, "دراسة الجدوى والتوقعات المالية لـ 3 سنوات", "المؤشرات المالية")

    col_w = Inches(3.6)
    row_h = Inches(4.8)
    add_card(s6, Inches(0.8), Inches(1.8), col_w, row_h, "السنة الأولى (2026)", 
             "• عدد العمليات المستهدفة: 200 سيارة\n• متوسط عمولة العملية: 12,000 ج.م\n• إجمالي الإيرادات المتوقعة: 2.4 مليون ج.م\n• المصاريف التشغيلية والتسويق: 1.6 مليون ج.م\n• صافي الربح المتوقع: 800,000 ج.م\n• نقطة التعادل: الشهر السابع",
             "📈", C_EMERALD)

    add_card(s6, Inches(4.85), Inches(1.8), col_w, row_h, "السنة الثانية (2027)", 
             "• عدد العمليات المستهدفة: 800 سيارة\n• متوسط عمولة العملية: 14,000 ج.م\n• إجمالي الإيرادات المتوقعة: 11.2 مليون ج.م\n• التوسع في الإسكندرية والدلتا\n• المصاريف التشغيلية: 4.5 مليون ج.م\n• صافي الربح المتوقع: 6.7 مليون ج.م",
             "🚀", C_EMERALD)

    add_card(s6, Inches(8.9), Inches(1.8), col_w, row_h, "السنة الثالثة (2028)", 
             "• عدد العمليات المستهدفة: 2,500 سيارة\n• متوسط عمولة العملية: 15,000 ج.م\n• إجمالي الإيرادات المتوقعة: 37.5 مليون ج.م\n• إطلاق خدمات التمويل والضمانات الكبرى\n• المصاريف التشغيلية: 12 مليون ج.م\n• صافي الربح المتوقع: 25.5 مليون ج.م",
             "💎", C_GOLD)

    # -------------------------------------------------------------
    # SLIDE 7: TRACTION & LIVE PRODUCT
    # -------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    set_bg(s7)
    add_header(s7, "ما تم إنجازه على أرض الواقع (Live Traction)", "المنتج الحي والتكنولوجيا")

    w2 = Inches(5.6)
    h2 = Inches(2.3)
    add_card(s7, Inches(0.8), Inches(1.8), w2, h2, "المنصة حية ومفهرسة على جوجل", 
             "الموقع يعمل لايف برابط رسمي https://mokalasa.online مع شهادة أمان SSL وسرعة استجابة فائقة وملف Sitemap وتوافق كامل مع جوجل.", "🌐", C_EMERALD)

    add_card(s7, Inches(6.8), Inches(1.8), w2, h2, "معالج بيع ذكي (Sell Wizard)", 
             "نظام متكامل يتيح للمالك إدراج تفاصيل المديونية ونوع الحظر، مع حساب خصومات السداد المعجل لـ 10 بنوك مصرية تلقائياً.", "⚙️", C_EMERALD)

    add_card(s7, Inches(0.8), Inches(4.4), w2, h2, "حاسبة تسوية وتقسيط متقدمة", 
             "أداة دقيقة تحسب الأقساط، أرباح التقسيط، التكلفة الفعلية، والمقارنة الفورية بين عروض الكاش والتسوية المصرفية.", "🧮", C_EMERALD)

    add_card(s7, Inches(6.8), Inches(4.4), w2, h2, "بنية تحتية سحابية تتحمل 1,000+ مستخدم", 
             "قواعد بيانات سحابية مشفرة (Supabase Cloud) وسيرفرات Vercel Edge العالمية، مع أمان تام للبيانات ومطابقة للهوية الرقمية.", "☁️", C_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 8: LEGAL FRAMEWORK & GAFI INCORPORATION
    # -------------------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    set_bg(s8)
    add_header(s8, "الشكل القانوني وتأسيس الشركة في مصر (GAFI)", "الإطار المؤسسي والترخيص")

    col_w = Inches(3.6)
    row_h = Inches(4.8)
    add_card(s8, Inches(0.8), Inches(1.8), col_w, row_h, "1. الكيان القانوني المقترح", 
             "شركة ذات مسؤولية محدودة (LLC / ش.ذ.م.م) قائمة على شريكين مؤسسين (محمود تامر وأخته) وفقاً لقانون الاستثمار 72 لسنة 2017 وقانون الشركات 159 لسنة 1981.\n\n• توفر حماية كاملة للذمة المالية لكلا الشريكين.\n• تعزز المصداقية المؤسسية أمام البنوك والجهات التمويلية.",
             "🏢", C_EMERALD)

    add_card(s8, Inches(4.85), Inches(1.8), col_w, row_h, "2. تصنيف النشاط الرسمي", 
             "• وساطة تجارية وإلكترونية في تقديم الخدمات.\n• إدارة وتشغيل المنصات وتطبيقات الهواتف الذكية.\n• استشارات تسويقية وفنية لقطاع السيارات.\n\n(تجنب تصنيفها كشركة تمويل استهلاكي الخاضعة للرقابة المالية لتفادي شرط الـ 75 مليون ج.م رأس مال).",
             "📜", C_EMERALD)

    add_card(s8, Inches(8.9), Inches(1.8), col_w, row_h, "3. التكلفة الدقيقة للتأسيس", 
             "• الحد الأدنى لرأس المال: 1,000 ج.م مقسم على حصص بين الشريكين.\n• رسوم الهيئة العامة للاستثمار: ~1,000 ج.م\n• نقابة المحامين وتوثيق العقود: ~1,250 ج.م\n• الغرفة التجارية والسجل التجاري: ~500 ج.م\n• النشر والشهادات: ~1,000 ج.م\n\nإجمالي الرسوم الحكومية الرسمية: ~3,500 إلى 5,500 ج.م فقط!",
             "💵", C_GOLD)

    # -------------------------------------------------------------
    # SLIDE 9: GO-TO-MARKET & MARKETING
    # -------------------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    set_bg(s9)
    add_header(s9, "خطة التسويق والاستحواذ على العملاء (Go-To-Market)", "خطة الانطلاق")

    w2 = Inches(5.6)
    h2 = Inches(2.3)
    add_card(s9, Inches(0.8), Inches(1.8), w2, h2, "1. الشراكة مع مراكز الفحص والمعارض", 
             "التعاقد مع مراكز الفحص المعتمدة ومعارض السيارات المستعملة لتكون نقاط استلام وفحص معتمدة للسيارات المسجلة بالمنصة.", "🏪", C_EMERALD)

    add_card(s9, Inches(6.8), Inches(1.8), w2, h2, "2. التسويق الرقمي المباشر", 
             "حملات ممولة على فيسبوك وإنستجرام وتيك توك تستهدف ملاك السيارات المتعثرين، مع تقديم استشارات مجانية لفحص مديونية البنك.", "📱", C_EMERALD)

    add_card(s9, Inches(0.8), Inches(4.4), w2, h2, "3. صدارة محركات البحث ومحركات الذكاء الاصطناعي", 
             "تحسين الـ SEO وملفات llms.txt للظهور الأول عند البحث عن 'عربيات حظر بيع' أو 'فك حظر سيارة' في جوجل، جيمناي، وChatGPT.", "🔍", C_EMERALD)

    add_card(s9, Inches(6.8), Inches(4.4), w2, h2, "4. صناعة المحتوى التوعوي والقانوني", 
             "فيديوهات قصيرة ومقالات تشرح الفروق القانونية ومخاطر العقود العرفية وكيفية التخارج الآمن من قروض السيارات بدون أي قضايا.", "🎬", C_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 10: THE ASK (طلبنا من الحاضنة)
    # -------------------------------------------------------------
    s10 = prs.slides.add_slide(blank_layout)
    set_bg(s10)
    add_header(s10, "طلبنا من حاضنة الأعمال (The Ask & Partnership)", "خارطة التعاون")

    col_w = Inches(3.6)
    row_h = Inches(4.8)
    add_card(s10, Inches(0.8), Inches(1.8), col_w, row_h, "1. تأسيس الشركة والتراخيص", 
             "• تمويل وإنهاء إجراءات تأسيس شركة ذات مسؤولية محدودة (LLC) للشريكين المؤسسين في الهيئة العامة للاستثمار (GAFI).\n• استخراج السجل التجاري والبطاقة الضريبية والتراخيص الإلكترونية اللازمة.",
             "🏛️", C_EMERALD)

    add_card(s10, Inches(4.85), Inches(1.8), col_w, row_h, "2. التشبيك المصرفي والمؤسسي", 
             "• فتح قنوات تواصل رسمية مع إدارات التسوية والتحصيل بالبنوك المصرية الكبرى.\n• بناء شراكات مع شركات التمويل الاستهلاكي (كونتكت، فاليو، درايف) لتسهيل استخراج المخالصات.",
             "🤝", C_EMERALD)

    add_card(s10, Inches(8.9), Inches(1.8), col_w, row_h, "3. الإرشاد ومساحة العمل", 
             "• توجيه استراتيجي وقانوني لتدقيق العقود النموذجية للوساطة والتقسيط.\n• دعم تسويقي ومساحة مكتبية لاحتضان فريق العمل خلال مرحلة النمو الأولى.",
             "🚀", C_GOLD)

    # Save presentation
    out_desktop = r"C:\Users\tamer.salah\Desktop\Mokhalasa_Incubator_Pitch_Deck_2026.pptx"
    out_public = r"C:\Users\tamer.salah\.gemini\antigravity\scratch\mokhalasa-app\public\Mokhalasa_Incubator_Pitch_Deck_2026.pptx"
    prs.save(out_desktop)
    prs.save(out_public)
    print(f"PowerPoint successfully created: {out_desktop}")

if __name__ == "__main__":
    build_pitch_deck()
