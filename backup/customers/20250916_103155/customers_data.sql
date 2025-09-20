--
-- PostgreSQL database dump
--

\restrict MsAh6aG9j37yBTAVpq5x8sEkDdeG73oKLNkT6ET3z85hK7c8g99mqg7TezabPZ2

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.customers VALUES (1, 'Тестовый клиент', 'test@example.com', '+7 (999) 123-45-67', NULL, NULL, 'Источник: sofany.pro', 'active', 1, '2025-09-11 15:57:58.234739', '2025-09-11 15:57:58.234739');
INSERT INTO public.customers VALUES (2, 'Иван Петров', 'ivan@example.com', '+7 (999) 555-12-34', NULL, NULL, 'Источник: sofany.pro', 'active', 1, '2025-09-11 16:02:55.010225', '2025-09-11 16:02:55.010225');
INSERT INTO public.customers VALUES (3, 'Мария Сидорова', 'maria.sidorova@example.com', '+7 (999) 987-65-43', NULL, NULL, 'Источник: sofany.pro', 'active', 1, '2025-09-11 16:23:11.526406', '2025-09-11 16:23:11.526406');
INSERT INTO public.customers VALUES (4, 'Анна Козлова', 'anna.kozlova@example.com', '+7 (999) 555-44-33', NULL, NULL, 'Источник: sofany.pro', 'active', 1, '2025-09-11 16:24:01.726461', '2025-09-11 16:24:01.726461');
INSERT INTO public.customers VALUES (5, 'Петр Иванов', 'petr.ivanov@example.com', '+7 (999) 111-22-33', NULL, NULL, 'Источник: sofany.pro', 'active', 1, '2025-09-11 16:28:26.13479', '2025-09-11 16:28:26.13479');
INSERT INTO public.customers VALUES (125, 'Тестовый клиент для импорта', 'test-import@example.com', '+7-999-987-65-43', NULL, NULL, 'Тестовый клиент для проверки импорта', 'active', NULL, '2025-09-15 00:51:13.538637', '2025-09-15 00:51:13.538637');
INSERT INTO public.customers VALUES (14, 'Иванов Иван Иванович', 'ivanov@test.com', '+7-999-111-11-11', NULL, 'г. Москва, ул. Тверская, д. 15, кв. 45', 'Тестовый клиент для CALC-001', 'active', 1, '2025-09-11 23:45:16.060143', '2025-09-11 23:45:16.060143');
INSERT INTO public.customers VALUES (15, 'Петрова Анна Сергеевна', 'petrova@test.com', '+7-999-222-22-22', NULL, 'г. Москва, ул. Арбат, д. 25, кв. 12', 'Тестовый клиент для CALC-002', 'active', 1, '2025-09-11 23:45:16.1575', '2025-09-11 23:45:16.1575');
INSERT INTO public.customers VALUES (16, 'Сидоров Петр Александрович', 'sidorov@test.com', '+7-999-333-33-33', NULL, 'г. Москва, ул. Ленинский проспект, д. 50, кв. 78', 'Тестовый клиент для CALC-003', 'active', 1, '2025-09-11 23:45:16.165466', '2025-09-11 23:45:16.165466');
INSERT INTO public.customers VALUES (17, 'Козлова Мария Владимировна', 'kozlova@test.com', '+7-999-444-44-44', NULL, 'г. Москва, ул. Садовое кольцо, д. 30, кв. 25', 'Тестовый клиент для CALC-004', 'active', 1, '2025-09-11 23:45:16.172001', '2025-09-11 23:45:16.172001');
INSERT INTO public.customers VALUES (18, 'Волков Алексей Николаевич', 'volkov@test.com', '+7-999-555-55-55', NULL, 'г. Москва, ул. Кутузовский проспект, д. 15, кв. 67', 'Тестовый клиент для CALC-005', 'active', 1, '2025-09-11 23:45:16.178377', '2025-09-11 23:45:16.178377');
INSERT INTO public.customers VALUES (19, 'Морозова Елена Дмитриевна', 'morozova@test.com', '+7-999-666-66-66', NULL, 'г. Москва, ул. Новый Арбат, д. 40, кв. 33', 'Тестовый клиент для CALC-006', 'active', 1, '2025-09-11 23:45:16.185038', '2025-09-11 23:45:16.185038');
INSERT INTO public.customers VALUES (20, 'Новиков Сергей Петрович', 'novikov@test.com', '+7-999-777-77-77', NULL, 'г. Москва, ул. Профсоюзная, д. 60, кв. 89', 'Тестовый клиент для CALC-007', 'active', 1, '2025-09-11 23:45:16.193298', '2025-09-11 23:45:16.193298');
INSERT INTO public.customers VALUES (21, 'Федорова Ольга Игоревна', 'fedorova@test.com', '+7-999-888-88-88', NULL, 'г. Москва, ул. Тверская-Ямская, д. 20, кв. 15', 'Тестовый клиент для CALC-008', 'active', 1, '2025-09-11 23:45:16.199957', '2025-09-11 23:45:16.199957');
INSERT INTO public.customers VALUES (22, 'Григорьев Дмитрий Сергеевич', 'grigoriev@test.com', '+7-999-999-99-99', NULL, 'г. Москва, ул. Ломоносовский проспект, д. 25, кв. 120', 'Тестовый клиент для CALC-009', 'active', 1, '2025-09-11 23:45:16.20696', '2025-09-11 23:45:16.20696');
INSERT INTO public.customers VALUES (23, 'Соколова Наталья Александровна', 'sokolova@test.com', '+7-999-000-00-00', NULL, 'г. Москва, ул. Красная Площадь, д. 1, кв. 1', 'Тестовый клиент для CALC-010', 'active', 1, '2025-09-11 23:45:16.215877', '2025-09-11 23:45:16.215877');
INSERT INTO public.customers VALUES (24, 'Кузнецов Андрей Владимирович', 'kuznetsov@test.com', '+7-999-111-22-33', NULL, 'г. Москва, ул. Маяковского, д. 35, кв. 45', 'Тестовый клиент для CRM-001', 'active', 1, '2025-09-11 23:45:16.22311', '2025-09-11 23:45:16.22311');
INSERT INTO public.customers VALUES (25, 'Лебедева Ирина Сергеевна', 'lebedeva@test.com', '+7-999-222-33-44', NULL, 'г. Москва, ул. Гагарина, д. 40, кв. 67', 'Тестовый клиент для CRM-002', 'active', 1, '2025-09-11 23:45:16.228676', '2025-09-11 23:45:16.228676');
INSERT INTO public.customers VALUES (26, 'Медведев Павел Игоревич', 'medvedev@test.com', '+7-999-333-44-55', NULL, 'г. Москва, ул. Сокольники, д. 15, кв. 23', 'Тестовый клиент для CRM-003', 'active', 1, '2025-09-11 23:45:16.235805', '2025-09-11 23:45:16.235805');
INSERT INTO public.customers VALUES (27, 'Романова Екатерина Дмитриевна', 'romanova@test.com', '+7-999-444-55-66', NULL, 'г. Москва, ул. Воробьевы горы, д. 5, кв. 12', 'Тестовый клиент для CRM-004', 'active', 1, '2025-09-11 23:45:16.314369', '2025-09-11 23:45:16.314369');
INSERT INTO public.customers VALUES (28, 'Степанов Михаил Андреевич', 'stepanov@test.com', '+7-999-555-66-77', NULL, 'г. Москва, ул. Чистые пруды, д. 25, кв. 78', 'Тестовый клиент для CRM-005', 'active', 1, '2025-09-11 23:45:16.32179', '2025-09-11 23:45:16.32179');
INSERT INTO public.customers VALUES (29, 'Тихонова Анна Владимировна', 'tihonova@test.com', '+7-999-666-77-88', NULL, 'г. Москва, ул. Парк Победы, д. 10, кв. 34', 'Тестовый клиент для CRM-006', 'active', 1, '2025-09-11 23:45:16.327271', '2025-09-11 23:45:16.327271');
INSERT INTO public.customers VALUES (30, 'Устинов Денис Сергеевич', 'ustinov@test.com', '+7-999-777-88-99', NULL, 'г. Москва, ул. Тверской бульвар, д. 30, кв. 56', 'Тестовый клиент для CRM-007', 'active', 1, '2025-09-11 23:45:16.334309', '2025-09-11 23:45:16.334309');
INSERT INTO public.customers VALUES (31, 'Филиппова Ольга Николаевна', 'filippova@test.com', '+7-999-888-99-00', NULL, 'г. Москва, ул. Неглинная, д. 20, кв. 45', 'Тестовый клиент для CRM-008', 'active', 1, '2025-09-11 23:45:16.341042', '2025-09-11 23:45:16.341042');
INSERT INTO public.customers VALUES (32, 'Харитонов Игорь Дмитриевич', 'haritonov@test.com', '+7-999-999-00-11', NULL, 'г. Москва, ул. Садовническая, д. 15, кв. 89', 'Тестовый клиент для CRM-009', 'active', 1, '2025-09-11 23:45:16.348922', '2025-09-11 23:45:16.348922');
INSERT INTO public.customers VALUES (33, 'Цветкова Марина Александровна', 'tsvetkova@test.com', '+7-999-000-11-22', NULL, 'г. Москва, ул. Бульварное кольцо, д. 40, кв. 67', 'Тестовый клиент для CRM-010', 'active', 1, '2025-09-11 23:45:16.356327', '2025-09-11 23:45:16.356327');
INSERT INTO public.customers VALUES (34, 'Тестовый клиент', '', '', '', '', 'Тест', 'active', 1, '2025-09-12 09:07:51.043941', '2025-09-12 09:07:51.043941');
INSERT INTO public.customers VALUES (39, 'Иван Петров', 'ivan@test.com', '+7-900-123-45-67', NULL, NULL, 'Источник: sofany.pro', 'active', 1, '2025-09-12 15:40:05.429287', '2025-09-12 15:40:05.429287');
INSERT INTO public.customers VALUES (41, 'Тестовый клиент', 'test-1757687460134@example.com', '+7-999-123-45-67', 'ООО Тест', NULL, NULL, 'active', NULL, '2025-09-12 17:31:00.15383', '2025-09-12 17:31:00.15383');
INSERT INTO public.customers VALUES (42, 'Тестовый клиент', 'test-1757687553227@example.com', '+7-999-123-45-67', 'ООО Тест', NULL, NULL, 'active', NULL, '2025-09-12 17:32:33.247046', '2025-09-12 17:32:33.247046');
INSERT INTO public.customers VALUES (43, 'Тестовый клиент калькулятора', 'test-calc-1757688990344@example.com', '+7-999-123-45-67', 'ООО Тест Калькулятор', NULL, NULL, 'active', NULL, '2025-09-12 17:56:30.363205', '2025-09-12 17:56:30.363205');
INSERT INTO public.customers VALUES (44, 'Тестовый клиент калькулятора', 'test-calc-1757689129190@example.com', '+7-999-123-45-67', 'ООО Тест Калькулятор', NULL, NULL, 'active', NULL, '2025-09-12 17:58:49.213304', '2025-09-12 17:58:49.213304');
INSERT INTO public.customers VALUES (45, 'Тестовый клиент для API', 'test-api@example.com', '+7-999-123-45-67', NULL, NULL, 'Тестовый клиент для проверки API', 'active', 1, '2025-09-12 18:08:22.817002', '2025-09-12 18:08:22.817002');
INSERT INTO public.customers VALUES (47, 'Михаил Сидоров', 'sidorov.m@example.com', '+7-999-222-33-44', 'ИП Сидоров', NULL, 'Частный клиент, заказывает столы и стулья', 'active', NULL, '2025-09-12 19:18:26.972507', '2025-09-12 19:18:26.972507');
INSERT INTO public.customers VALUES (48, 'Елена Козлова', 'kozlova.elena@example.com', '+7-999-333-44-55', 'ООО "Дом и Сад"', NULL, 'Регулярные заказы мягкой мебели', 'active', NULL, '2025-09-12 19:18:26.972507', '2025-09-12 19:18:26.972507');
INSERT INTO public.customers VALUES (49, 'Дмитрий Волков', 'volkov.d@example.com', '+7-999-444-55-66', 'ООО "ОфисМебель"', NULL, 'Корпоративные заказы офисной мебели', 'active', NULL, '2025-09-12 19:18:26.972507', '2025-09-12 19:18:26.972507');
INSERT INTO public.customers VALUES (50, 'Ольга Смирнова', 'smirnova.olga@example.com', '+7-999-555-66-77', 'ИП Смирнова', NULL, 'Дизайнер интерьеров, VIP клиент', 'active', NULL, '2025-09-12 19:18:26.972507', '2025-09-12 19:18:26.972507');
INSERT INTO public.customers VALUES (51, 'Сергей Кузнецов', 'kuznetsov.s@example.com', '+7-999-666-77-88', 'ООО "МебельСервис"', NULL, 'Оптовые заказы для перепродажи', 'active', NULL, '2025-09-12 19:18:26.972507', '2025-09-12 19:18:26.972507');
INSERT INTO public.customers VALUES (52, 'Татьяна Новикова', 'novikova.t@example.com', '+7-999-777-88-99', 'ООО "Стиль и Комфорт"', NULL, 'Салон мебели, регулярные поставки', 'active', NULL, '2025-09-12 19:18:26.972507', '2025-09-12 19:18:26.972507');
INSERT INTO public.customers VALUES (53, 'Александр Морозов', 'morozov.a@example.com', '+7-999-888-99-00', 'ИП Морозов', NULL, 'Бывший клиент, не заказывал более года', 'inactive', NULL, '2025-09-12 19:18:26.972507', '2025-09-12 19:18:26.972507');
INSERT INTO public.customers VALUES (54, 'Мария Федорова', 'fedorova.m@example.com', '+7-999-999-00-11', 'ООО "Дом Мечты"', NULL, 'Строительная компания, заказы для новостроек', 'active', NULL, '2025-09-12 19:18:26.972507', '2025-09-12 19:18:26.972507');
INSERT INTO public.customers VALUES (55, 'Владимир Иванов', 'ivanov.v@example.com', '+7-999-000-11-22', 'ООО "ЭлитМебель"', NULL, 'Премиум сегмент, эксклюзивные заказы', 'active', NULL, '2025-09-12 19:18:26.972507', '2025-09-12 19:18:26.972507');
INSERT INTO public.customers VALUES (46, 'Анна Петрова', 'petrova.anna@example.com', '+7-999-111-22-33', 'ООО "Мебель Плюс"', NULL, '', 'active', NULL, '2025-09-12 19:18:26.972507', '2025-09-12 23:45:38.1172');
INSERT INTO public.customers VALUES (122, 'Тестовый клиент для QR', 'qr-test@example.com', '+7-999-123-45-67', NULL, NULL, NULL, 'active', NULL, '2025-09-14 23:15:14.743357', '2025-09-14 23:15:14.743357');
INSERT INTO public.customers VALUES (63, 'Тестовый Мастер', 'test.master@example.com', '97888788668', NULL, NULL, NULL, 'active', NULL, '2025-09-14 17:19:20.888785', '2025-09-14 17:19:20.888785');
INSERT INTO public.customers VALUES (64, 'Тестовый Мастер Полный', 'test.master.full@example.com', '97888788668', NULL, NULL, NULL, 'active', NULL, '2025-09-14 17:22:02.705084', '2025-09-14 17:22:02.705084');
INSERT INTO public.customers VALUES (132, 'Тест Клиент 1757935832622', 'test1757935832622@example.com', '+7-999-123-4567', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 14:30:32.659167', '2025-09-15 14:30:32.659167');
INSERT INTO public.customers VALUES (133, 'Тест Клиент 1757935841337', 'test1757935841337@example.com', '+7-999-123-4567', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 14:30:41.364343', '2025-09-15 14:30:41.364343');
INSERT INTO public.customers VALUES (134, 'Тест Клиент 1757935866701', 'test1757935866701@example.com', '+7-999-123-4567', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 14:30:41.379369', '2025-09-15 14:30:41.379369');
INSERT INTO public.customers VALUES (135, 'Тест Клиент 1757935874080', 'test1757935874080@example.com', '+7-999-123-4567', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 14:30:41.379369', '2025-09-15 14:30:41.379369');
INSERT INTO public.customers VALUES (136, 'Тест Клиент 1757935895322', 'test1757935895322@example.com', '+7-999-123-4567', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 14:31:35.346441', '2025-09-15 14:31:35.346441');
INSERT INTO public.customers VALUES (137, 'Тест Клиент 1757935909026', 'test1757935909026@example.com', '+7-999-123-4567', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 14:31:49.050601', '2025-09-15 14:31:49.050601');
INSERT INTO public.customers VALUES (138, 'Тест Чертежи 1757936140228', 'drawings1757936140228@example.com', '+7-999-123-4567', 'Компания с чертежами', NULL, NULL, 'active', NULL, '2025-09-15 14:35:40.266071', '2025-09-15 14:35:40.266071');
INSERT INTO public.customers VALUES (139, 'Тест Чертежи 1757936170922', 'drawings1757936170922@example.com', '+7-999-123-4567', 'Компания с чертежами', NULL, NULL, 'active', NULL, '2025-09-15 14:36:10.959525', '2025-09-15 14:36:10.959525');
INSERT INTO public.customers VALUES (140, 'Тест Чертежи 1757936195995', 'drawings1757936195995@example.com', '+7-999-123-4567', 'Компания с чертежами', NULL, NULL, 'active', NULL, '2025-09-15 14:36:36.027913', '2025-09-15 14:36:36.027913');
INSERT INTO public.customers VALUES (141, 'Тест Эксперт 1757937504677', 'expert1757937504677@example.com', '+7-999-123-4567', 'Компания для теста экспертной страницы', NULL, NULL, 'active', NULL, '2025-09-15 14:58:24.813536', '2025-09-15 14:58:24.813536');
INSERT INTO public.customers VALUES (143, 'Тестовый клиент 1757944093954', 'test1757944093954@example.com', '+7 (999) 4093954', 'ООО Тест 1757944093954', NULL, NULL, 'active', NULL, '2025-09-15 16:48:13.989298', '2025-09-15 16:48:13.989298');
INSERT INTO public.customers VALUES (144, 'Тест', 'test123@example.com', '+7 999 123 45 67', 'ООО Тест', NULL, NULL, 'active', NULL, '2025-09-15 16:48:19.053432', '2025-09-15 16:48:19.053432');
INSERT INTO public.customers VALUES (146, 'Тестовый клиент 1757944115842', 'test1757944115842@example.com', '+7 (999) 4115842', 'ООО Тест 1757944115842', NULL, NULL, 'active', NULL, '2025-09-15 16:48:35.901847', '2025-09-15 16:48:35.901847');
INSERT INTO public.customers VALUES (147, 'Тестовый клиент 1757945614003', 'test1757945614003@example.com', '+77945614003', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 17:13:34.05221', '2025-09-15 17:13:34.05221');
INSERT INTO public.customers VALUES (148, 'Тестовый клиент 1757945624292', 'test1757945624292@example.com', '+77945624292', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 17:13:44.316396', '2025-09-15 17:13:44.316396');
INSERT INTO public.customers VALUES (149, 'Тестовый клиент 1757945635940', 'test1757945635940@example.com', '+77945635940', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 17:13:55.963396', '2025-09-15 17:13:55.963396');
INSERT INTO public.customers VALUES (150, 'Тестовый клиент 1757945648873', 'test1757945648873@example.com', '+77945648873', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 17:13:55.977581', '2025-09-15 17:13:55.977581');
INSERT INTO public.customers VALUES (151, 'Тестовый клиент 1757945663059', 'test1757945663059@example.com', '+77945663059', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 17:13:55.977581', '2025-09-15 17:13:55.977581');
INSERT INTO public.customers VALUES (152, 'Тестовый клиент 1757945674402', 'test1757945674402@example.com', '+77945674402', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 17:13:55.977581', '2025-09-15 17:13:55.977581');
INSERT INTO public.customers VALUES (153, 'Тестовый клиент 1757945694350', 'test1757945694350@example.com', '+77945694350', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 17:14:34.838931', '2025-09-15 17:14:34.838931');
INSERT INTO public.customers VALUES (154, 'Тестовый клиент 1757945706714', 'test1757945706714@example.com', '+77945706714', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 17:15:06.740865', '2025-09-15 17:15:06.740865');
INSERT INTO public.customers VALUES (155, 'Тестовый клиент 1757945733659', 'test1757945733659@example.com', '+77945733659', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 17:15:33.685575', '2025-09-15 17:15:33.685575');
INSERT INTO public.customers VALUES (156, 'Тестовый клиент 1757945754417', 'test1757945754417@example.com', '+77945754417', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 17:15:54.441034', '2025-09-15 17:15:54.441034');
INSERT INTO public.customers VALUES (157, 'Тестовый клиент 1757945827307', 'test1757945827307@example.com', '+77945827307', 'Тестовая компания', NULL, NULL, 'active', NULL, '2025-09-15 17:17:07.334768', '2025-09-15 17:17:07.334768');
INSERT INTO public.customers VALUES (167, 'Клиент и доставка', 'client_1757972042820@temp.com', '14423232433', NULL, NULL, NULL, 'active', NULL, '2025-09-16 00:33:07.758061', '2025-09-16 00:33:07.758061');
INSERT INTO public.customers VALUES (168, 'Клиент и доставка', 'client_1757972184162@temp.com', 'Клиент и доставка', NULL, NULL, NULL, 'active', NULL, '2025-09-16 00:36:24.166835', '2025-09-16 00:36:24.166835');
INSERT INTO public.customers VALUES (169, '123', '123@wrt.srth', '12412332', 'agasg', NULL, '123', 'active', NULL, '2025-09-16 10:28:08.414399', '2025-09-16 10:28:08.414399');
INSERT INTO public.customers VALUES (170, '123123132', '12312313@qwf.rr', '123123123', '123132132', NULL, '123132123', 'active', NULL, '2025-09-16 10:30:59.545594', '2025-09-16 10:30:59.545594');


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 170, true);


--
-- PostgreSQL database dump complete
--

\unrestrict MsAh6aG9j37yBTAVpq5x8sEkDdeG73oKLNkT6ET3z85hK7c8g99mqg7TezabPZ2

