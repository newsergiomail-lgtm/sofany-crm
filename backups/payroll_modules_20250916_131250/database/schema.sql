--
-- PostgreSQL database dump
--

\restrict VoBoX1kbpXViNdKtV2YE83YphBybsb5Z0Ps3oZrd8jf5q4qbtdx5eJ5xIAjlFKe

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
-- Name: calculate_work_duration(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_work_duration() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.finished_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.work_duration = EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at)) / 60;
        NEW.is_completed = true;
        
        -- Расчет оплаты если указана ставка
        IF NEW.hourly_rate > 0 THEN
            NEW.total_payment = (NEW.work_duration / 60.0) * NEW.hourly_rate;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.calculate_work_duration() OWNER TO postgres;

--
-- Name: can_transfer_to_stage(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.can_transfer_to_stage(p_order_id integer, p_from_stage_id integer, p_to_stage_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    from_stage_order INTEGER;
    to_stage_order INTEGER;
    current_stage_order INTEGER;
BEGIN
    -- Получаем порядковые номера этапов
    SELECT order_index INTO from_stage_order FROM production_stages WHERE id = p_from_stage_id;
    SELECT order_index INTO to_stage_order FROM production_stages WHERE id = p_to_stage_id;
    
    -- Получаем текущий этап заказа
    SELECT current_stage_id INTO current_stage_order FROM orders WHERE id = p_order_id;
    SELECT order_index INTO current_stage_order FROM production_stages WHERE id = current_stage_order;
    
    -- Проверяем возможность перехода
    -- Можно перейти на следующий этап, на предыдущий (для доработки) или на параллельный
    RETURN (to_stage_order = current_stage_order + 1) OR 
           (to_stage_order < current_stage_order) OR
           (to_stage_order = current_stage_order); -- для параллельной работы
END;
$$;


ALTER FUNCTION public.can_transfer_to_stage(p_order_id integer, p_from_stage_id integer, p_to_stage_id integer) OWNER TO postgres;

--
-- Name: check_materials_for_stage(integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_materials_for_stage(p_order_id integer, p_stage character varying) RETURNS TABLE(material_name character varying, required_quantity numeric, available_quantity numeric, missing_quantity numeric, unit character varying, is_blocked boolean)
    LANGUAGE plpgsql
    AS $$ BEGIN RETURN QUERY SELECT DISTINCT om.material_name, om.required_quantity, COALESCE(m.current_stock, 0) as available_quantity, GREATEST(0, om.required_quantity - COALESCE(m.current_stock, 0)) as missing_quantity, om.unit, (om.required_quantity > COALESCE(m.current_stock, 0)) as blocked_status FROM order_materials om LEFT JOIN materials m ON LOWER(m.name) = LOWER(om.material_name) INNER JOIN production_requirements pr ON LOWER(om.material_name) = LOWER(pr.material_name) WHERE om.order_id = p_order_id AND pr.stage = p_stage AND pr.is_required = true AND om.required_quantity > 0; END; $$;


ALTER FUNCTION public.check_materials_for_stage(p_order_id integer, p_stage character varying) OWNER TO postgres;

--
-- Name: check_user_permission(character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: workunital
--

CREATE FUNCTION public.check_user_permission(user_role character varying, module_name character varying, permission_name character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM role_permissions 
        WHERE role = user_role 
        AND module = module_name 
        AND permission = permission_name 
        AND granted = true
    );
END;
$$;


ALTER FUNCTION public.check_user_permission(user_role character varying, module_name character varying, permission_name character varying) OWNER TO workunital;

--
-- Name: FUNCTION check_user_permission(user_role character varying, module_name character varying, permission_name character varying); Type: COMMENT; Schema: public; Owner: workunital
--

COMMENT ON FUNCTION public.check_user_permission(user_role character varying, module_name character varying, permission_name character varying) IS 'Проверить разрешение пользователя';


--
-- Name: create_production_notification(integer, integer, character varying, character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_production_notification(p_user_id integer, p_order_id integer, p_type character varying, p_title character varying, p_message text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    notification_id INTEGER;
BEGIN
    INSERT INTO production_notifications (user_id, order_id, type, title, message)
    VALUES (p_user_id, p_order_id, p_type, p_title, p_message)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;


ALTER FUNCTION public.create_production_notification(p_user_id integer, p_order_id integer, p_type character varying, p_title character varying, p_message text) OWNER TO postgres;

--
-- Name: get_module_settings(character varying); Type: FUNCTION; Schema: public; Owner: workunital
--

CREATE FUNCTION public.get_module_settings(module_name_param character varying) RETURNS TABLE(setting_key character varying, value text, description text, data_type character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.setting_key,
        ms.value,
        ms.description,
        ms.data_type
    FROM module_settings ms
    WHERE ms.module_name = module_name_param;
END;
$$;


ALTER FUNCTION public.get_module_settings(module_name_param character varying) OWNER TO workunital;

--
-- Name: FUNCTION get_module_settings(module_name_param character varying); Type: COMMENT; Schema: public; Owner: workunital
--

COMMENT ON FUNCTION public.get_module_settings(module_name_param character varying) IS 'Получить настройки конкретного модуля';


--
-- Name: update_customers_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_customers_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_customers_updated_at() OWNER TO postgres;

--
-- Name: update_order_blocks(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_order_blocks(p_order_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    blocked_stages TEXT[] := '{}';
    stage_name VARCHAR(50);
    is_blocked BOOLEAN;
BEGIN
    -- Проверяем каждый этап
    FOR stage_name IN SELECT DISTINCT stage FROM production_requirements WHERE is_required = true LOOP
        SELECT EXISTS(
            SELECT 1 FROM check_materials_for_stage(p_order_id, stage_name) 
            WHERE is_blocked = true
        ) INTO is_blocked;
        
        IF is_blocked THEN
            blocked_stages := array_append(blocked_stages, stage_name);
        END IF;
    END LOOP;
    
    -- Обновляем заказ
    UPDATE orders 
    SET 
        blocked_by_materials = (array_length(blocked_stages, 1) > 0),
        blocked_stages = blocked_stages
    WHERE id = p_order_id;
END;
$$;


ALTER FUNCTION public.update_order_blocks(p_order_id integer) OWNER TO postgres;

--
-- Name: update_production_blocks_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_production_blocks_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_production_blocks_updated_at() OWNER TO postgres;

--
-- Name: update_suppliers_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_suppliers_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_suppliers_updated_at() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: workunital
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN NEW.last_updated = CURRENT_TIMESTAMP; RETURN NEW; END; $$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO workunital;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bonuses_penalties; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.bonuses_penalties (
    id integer NOT NULL,
    employee_id integer,
    type character varying(20) NOT NULL,
    amount numeric(10,2) NOT NULL,
    reason text NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    CONSTRAINT bonuses_penalties_type_check CHECK (((type)::text = ANY ((ARRAY['bonus'::character varying, 'penalty'::character varying])::text[])))
);


ALTER TABLE public.bonuses_penalties OWNER TO workunital;

--
-- Name: bonuses_penalties_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.bonuses_penalties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bonuses_penalties_id_seq OWNER TO workunital;

--
-- Name: bonuses_penalties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.bonuses_penalties_id_seq OWNED BY public.bonuses_penalties.id;


--
-- Name: calculator_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calculator_orders (
    id integer NOT NULL,
    order_id integer,
    calculator_data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.calculator_orders OWNER TO postgres;

--
-- Name: calculator_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calculator_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.calculator_orders_id_seq OWNER TO postgres;

--
-- Name: calculator_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calculator_orders_id_seq OWNED BY public.calculator_orders.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(50) DEFAULT 'primary'::character varying,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50),
    company character varying(255),
    address text,
    notes text,
    status character varying(50) DEFAULT 'active'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO workunital;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.departments_id_seq OWNER TO workunital;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    department character varying(100) NOT NULL,
    "position" character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hire_date date
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: financial_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_transactions (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    category character varying(100) NOT NULL,
    amount numeric(12,2) NOT NULL,
    description text,
    order_id integer,
    created_by integer,
    transaction_date date DEFAULT CURRENT_DATE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.financial_transactions OWNER TO postgres;

--
-- Name: financial_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.financial_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.financial_transactions_id_seq OWNER TO postgres;

--
-- Name: financial_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.financial_transactions_id_seq OWNED BY public.financial_transactions.id;


--
-- Name: integration_settings; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.integration_settings (
    id integer NOT NULL,
    integration_name character varying(100) NOT NULL,
    is_enabled boolean DEFAULT false,
    config jsonb,
    credentials jsonb,
    last_sync timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.integration_settings OWNER TO workunital;

--
-- Name: TABLE integration_settings; Type: COMMENT; Schema: public; Owner: workunital
--

COMMENT ON TABLE public.integration_settings IS 'Настройки внешних интеграций';


--
-- Name: integration_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.integration_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.integration_settings_id_seq OWNER TO workunital;

--
-- Name: integration_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.integration_settings_id_seq OWNED BY public.integration_settings.id;


--
-- Name: kanban_columns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kanban_columns (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    color character varying(7) DEFAULT '#d1fae5'::character varying NOT NULL,
    type character varying(20) DEFAULT 'common'::character varying NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.kanban_columns OWNER TO postgres;

--
-- Name: kanban_columns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kanban_columns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.kanban_columns_id_seq OWNER TO postgres;

--
-- Name: kanban_columns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kanban_columns_id_seq OWNED BY public.kanban_columns.id;


--
-- Name: material_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.material_categories OWNER TO postgres;

--
-- Name: material_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.material_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.material_categories_id_seq OWNER TO postgres;

--
-- Name: material_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.material_categories_id_seq OWNED BY public.material_categories.id;


--
-- Name: material_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_usage (
    id integer NOT NULL,
    order_id integer,
    material_id integer,
    quantity_used numeric(10,2) NOT NULL,
    unit_cost numeric(10,2) NOT NULL,
    total_cost numeric(12,2) NOT NULL,
    operation_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.material_usage OWNER TO postgres;

--
-- Name: material_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.material_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.material_usage_id_seq OWNER TO postgres;

--
-- Name: material_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.material_usage_id_seq OWNED BY public.material_usage.id;


--
-- Name: materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.materials (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    category_id integer,
    unit character varying(50) NOT NULL,
    current_stock numeric(10,2) DEFAULT 0,
    min_stock numeric(10,2) DEFAULT 0,
    price_per_unit numeric(10,2) NOT NULL,
    supplier character varying(255),
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    quantity integer DEFAULT 0,
    minimum integer DEFAULT 0,
    price numeric(10,2) DEFAULT 0,
    supplier_id integer
);


ALTER TABLE public.materials OWNER TO postgres;

--
-- Name: materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.materials_id_seq OWNER TO postgres;

--
-- Name: materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.materials_id_seq OWNED BY public.materials.id;


--
-- Name: module_settings; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.module_settings (
    id integer NOT NULL,
    module_name character varying(100) NOT NULL,
    setting_key character varying(255) NOT NULL,
    value text,
    description text,
    data_type character varying(50) DEFAULT 'string'::character varying,
    is_required boolean DEFAULT false,
    validation_rules jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.module_settings OWNER TO workunital;

--
-- Name: TABLE module_settings; Type: COMMENT; Schema: public; Owner: workunital
--

COMMENT ON TABLE public.module_settings IS 'Настройки модулей CRM';


--
-- Name: module_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.module_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.module_settings_id_seq OWNER TO workunital;

--
-- Name: module_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.module_settings_id_seq OWNED BY public.module_settings.id;


--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.notification_settings (
    id integer NOT NULL,
    user_id integer,
    notification_type character varying(100) NOT NULL,
    enabled boolean DEFAULT true,
    channels jsonb DEFAULT '["email"]'::jsonb,
    frequency character varying(50) DEFAULT 'immediate'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notification_settings OWNER TO workunital;

--
-- Name: TABLE notification_settings; Type: COMMENT; Schema: public; Owner: workunital
--

COMMENT ON TABLE public.notification_settings IS 'Настройки уведомлений пользователей';


--
-- Name: notification_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.notification_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notification_settings_id_seq OWNER TO workunital;

--
-- Name: notification_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.notification_settings_id_seq OWNED BY public.notification_settings.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    data jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: operations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    price_per_unit numeric(10,2) NOT NULL,
    department character varying(100) NOT NULL,
    time_norm_minutes integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.operations OWNER TO postgres;

--
-- Name: operations_catalog; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.operations_catalog (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    department character varying(100) NOT NULL,
    estimated_time integer,
    difficulty_level integer,
    required_skills text[],
    materials_needed text[],
    tools_required text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT operations_catalog_difficulty_level_check CHECK (((difficulty_level >= 1) AND (difficulty_level <= 5)))
);


ALTER TABLE public.operations_catalog OWNER TO workunital;

--
-- Name: operations_catalog_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.operations_catalog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.operations_catalog_id_seq OWNER TO workunital;

--
-- Name: operations_catalog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.operations_catalog_id_seq OWNED BY public.operations_catalog.id;


--
-- Name: operations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.operations_id_seq OWNER TO postgres;

--
-- Name: operations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operations_id_seq OWNED BY public.operations.id;


--
-- Name: order_drawings; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.order_drawings (
    id integer NOT NULL,
    order_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_data bytea NOT NULL,
    file_type character varying(100) NOT NULL,
    file_size integer NOT NULL,
    uploaded_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_drawings OWNER TO workunital;

--
-- Name: order_drawings_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.order_drawings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_drawings_id_seq OWNER TO workunital;

--
-- Name: order_drawings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.order_drawings_id_seq OWNED BY public.order_drawings.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer,
    name character varying(255) NOT NULL,
    description text,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    materials_cost numeric(12,2) DEFAULT 0,
    labor_cost numeric(12,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: order_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_materials (
    id integer NOT NULL,
    order_id integer,
    material_name character varying(255) NOT NULL,
    required_quantity numeric(10,2) NOT NULL,
    unit character varying(50) NOT NULL,
    estimated_price numeric(10,2) DEFAULT 0,
    source character varying(50) DEFAULT 'calculator'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT order_materials_source_check CHECK (((source)::text = ANY ((ARRAY['calculator'::character varying, 'manual'::character varying, 'bom'::character varying])::text[])))
);


ALTER TABLE public.order_materials OWNER TO postgres;

--
-- Name: order_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_materials_id_seq OWNER TO postgres;

--
-- Name: order_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_materials_id_seq OWNED BY public.order_materials.id;


--
-- Name: order_qr_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_qr_codes (
    id integer NOT NULL,
    order_id integer NOT NULL,
    qr_code character varying(255) NOT NULL,
    current_stage_id integer NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_qr_codes OWNER TO postgres;

--
-- Name: TABLE order_qr_codes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.order_qr_codes IS 'QR-коды для отслеживания заказов';


--
-- Name: order_qr_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_qr_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_qr_codes_id_seq OWNER TO postgres;

--
-- Name: order_qr_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_qr_codes_id_seq OWNED BY public.order_qr_codes.id;


--
-- Name: order_returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_returns (
    id integer NOT NULL,
    order_id integer NOT NULL,
    from_stage_id integer NOT NULL,
    to_stage_id integer NOT NULL,
    return_type character varying(20) NOT NULL,
    reason text NOT NULL,
    returned_by integer NOT NULL,
    returned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_resolved boolean DEFAULT false,
    resolved_at timestamp without time zone,
    resolved_by integer,
    CONSTRAINT order_returns_return_type_check CHECK (((return_type)::text = ANY ((ARRAY['rework'::character varying, 'defect'::character varying])::text[])))
);


ALTER TABLE public.order_returns OWNER TO postgres;

--
-- Name: TABLE order_returns; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.order_returns IS 'Возвраты заказов на доработку или брак';


--
-- Name: order_returns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_returns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_returns_id_seq OWNER TO postgres;

--
-- Name: order_returns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_returns_id_seq OWNED BY public.order_returns.id;


--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_status_history (
    id integer NOT NULL,
    order_id integer,
    status character varying(50) NOT NULL,
    comment text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_status_history OWNER TO postgres;

--
-- Name: order_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_status_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_status_history_id_seq OWNER TO postgres;

--
-- Name: order_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_status_history_id_seq OWNED BY public.order_status_history.id;


--
-- Name: order_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_transfers (
    id integer NOT NULL,
    order_id integer NOT NULL,
    from_stage_id integer,
    to_stage_id integer NOT NULL,
    scanned_by integer NOT NULL,
    scanned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'pending'::character varying,
    notes text,
    transfer_type character varying(20) DEFAULT 'normal'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT order_transfers_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'ready'::character varying, 'rework'::character varying, 'defect'::character varying])::text[]))),
    CONSTRAINT order_transfers_transfer_type_check CHECK (((transfer_type)::text = ANY ((ARRAY['normal'::character varying, 'rework'::character varying, 'defect'::character varying, 'parallel'::character varying])::text[])))
);


ALTER TABLE public.order_transfers OWNER TO postgres;

--
-- Name: TABLE order_transfers; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.order_transfers IS 'Перемещения заказов между этапами';


--
-- Name: order_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_transfers_id_seq OWNER TO postgres;

--
-- Name: order_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_transfers_id_seq OWNED BY public.order_transfers.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_number character varying(50) NOT NULL,
    customer_id integer,
    product_name character varying(255),
    status character varying(50) DEFAULT 'new'::character varying,
    priority character varying(20) DEFAULT 'normal'::character varying,
    total_amount numeric(12,2) DEFAULT 0,
    paid_amount numeric(12,2) DEFAULT 0,
    delivery_date date,
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    project_description text,
    delivery_address text,
    has_elevator boolean,
    floor character varying(50),
    delivery_notes text,
    calculator_data jsonb,
    source character varying(20) DEFAULT 'crm'::character varying,
    additional_contact character varying(255),
    preferred_contact character varying(100),
    customer_name character varying(255),
    customer_phone character varying(50),
    customer_email character varying(255),
    customer_company character varying(255),
    short_description text,
    detailed_description text,
    blocked_by_materials boolean DEFAULT false,
    blocked_stages text[] DEFAULT '{}'::text[],
    current_stage_id integer,
    production_status character varying(20) DEFAULT 'pending'::character varying,
    qr_code_id integer,
    production_started_at timestamp without time zone,
    production_completed_at timestamp without time zone,
    CONSTRAINT orders_production_status_check CHECK (((production_status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'ready'::character varying, 'completed'::character varying, 'on_hold'::character varying])::text[])))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payroll; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    month character varying(7) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    work_count integer NOT NULL,
    total_hours numeric(5,2) DEFAULT 0,
    status character varying(20) DEFAULT 'calculated'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payroll OWNER TO postgres;

--
-- Name: payroll_calculations; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.payroll_calculations (
    id integer NOT NULL,
    employee_id integer,
    period_id integer,
    piecework_amount numeric(10,2) DEFAULT 0,
    hourly_amount numeric(10,2) DEFAULT 0,
    salary_amount numeric(10,2) DEFAULT 0,
    bonus_amount numeric(10,2) DEFAULT 0,
    penalty_amount numeric(10,2) DEFAULT 0,
    total_amount numeric(10,2) NOT NULL,
    hours_worked numeric(6,2) DEFAULT 0,
    operations_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payroll_calculations OWNER TO workunital;

--
-- Name: payroll_calculations_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.payroll_calculations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payroll_calculations_id_seq OWNER TO workunital;

--
-- Name: payroll_calculations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.payroll_calculations_id_seq OWNED BY public.payroll_calculations.id;


--
-- Name: payroll_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payroll_id_seq OWNER TO postgres;

--
-- Name: payroll_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_id_seq OWNED BY public.payroll.id;


--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.payroll_periods (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    total_payroll numeric(12,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    CONSTRAINT payroll_periods_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'calculated'::character varying, 'approved'::character varying, 'paid'::character varying])::text[])))
);


ALTER TABLE public.payroll_periods OWNER TO workunital;

--
-- Name: payroll_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.payroll_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payroll_periods_id_seq OWNER TO workunital;

--
-- Name: payroll_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.payroll_periods_id_seq OWNED BY public.payroll_periods.id;


--
-- Name: positions; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.positions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    department_id integer,
    payment_type character varying(50) NOT NULL,
    base_rate numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positions_payment_type_check CHECK (((payment_type)::text = ANY ((ARRAY['piecework'::character varying, 'hourly'::character varying, 'salary'::character varying, 'salary_bonus'::character varying])::text[])))
);


ALTER TABLE public.positions OWNER TO workunital;

--
-- Name: positions_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.positions_id_seq OWNER TO workunital;

--
-- Name: positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.positions_id_seq OWNED BY public.positions.id;


--
-- Name: production_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.production_blocks (
    id integer NOT NULL,
    order_id integer NOT NULL,
    stage character varying(50) NOT NULL,
    material_type character varying(50) NOT NULL,
    material_name character varying(255) NOT NULL,
    required_quantity numeric(10,2) NOT NULL,
    available_quantity numeric(10,2) NOT NULL,
    missing_quantity numeric(10,2) NOT NULL,
    unit character varying(20) NOT NULL,
    blocked_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp without time zone,
    status character varying(20) DEFAULT 'active'::character varying,
    created_by integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.production_blocks OWNER TO postgres;

--
-- Name: production_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.production_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.production_blocks_id_seq OWNER TO postgres;

--
-- Name: production_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.production_blocks_id_seq OWNED BY public.production_blocks.id;


--
-- Name: production_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.production_notifications (
    id integer NOT NULL,
    user_id integer,
    order_id integer,
    type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp without time zone
);


ALTER TABLE public.production_notifications OWNER TO postgres;

--
-- Name: TABLE production_notifications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.production_notifications IS 'Уведомления системы производства';


--
-- Name: production_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.production_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.production_notifications_id_seq OWNER TO postgres;

--
-- Name: production_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.production_notifications_id_seq OWNED BY public.production_notifications.id;


--
-- Name: production_operations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.production_operations (
    id integer NOT NULL,
    order_id integer,
    operation_type character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    assigned_to integer,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    production_stage character varying(50) DEFAULT 'КБ'::character varying,
    created_by integer
);


ALTER TABLE public.production_operations OWNER TO postgres;

--
-- Name: production_operations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.production_operations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.production_operations_id_seq OWNER TO postgres;

--
-- Name: production_operations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.production_operations_id_seq OWNED BY public.production_operations.id;


--
-- Name: production_professions; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.production_professions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    department character varying(100) NOT NULL,
    skill_level character varying(50) NOT NULL,
    hourly_rate numeric(10,2),
    required_education text,
    responsibilities text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.production_professions OWNER TO workunital;

--
-- Name: production_professions_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.production_professions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.production_professions_id_seq OWNER TO workunital;

--
-- Name: production_professions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.production_professions_id_seq OWNED BY public.production_professions.id;


--
-- Name: production_requirements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.production_requirements (
    id integer NOT NULL,
    stage character varying(50) NOT NULL,
    material_type character varying(50) NOT NULL,
    material_name character varying(255) NOT NULL,
    required_quantity numeric(10,2) NOT NULL,
    unit character varying(20) NOT NULL,
    is_required boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.production_requirements OWNER TO postgres;

--
-- Name: production_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.production_requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.production_requirements_id_seq OWNER TO postgres;

--
-- Name: production_requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.production_requirements_id_seq OWNED BY public.production_requirements.id;


--
-- Name: production_stages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.production_stages (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    order_index integer NOT NULL,
    description text,
    can_work_parallel boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.production_stages OWNER TO postgres;

--
-- Name: TABLE production_stages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.production_stages IS 'Этапы производства мебели';


--
-- Name: production_stages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.production_stages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.production_stages_id_seq OWNER TO postgres;

--
-- Name: production_stages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.production_stages_id_seq OWNED BY public.production_stages.id;


--
-- Name: production_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.production_stats AS
 SELECT ps.name AS stage_name,
    ps.order_index,
    count(o.id) AS orders_count,
    count(
        CASE
            WHEN ((o.production_status)::text = 'in_progress'::text) THEN 1
            ELSE NULL::integer
        END) AS in_progress,
    count(
        CASE
            WHEN ((o.production_status)::text = 'ready'::text) THEN 1
            ELSE NULL::integer
        END) AS ready,
    count(
        CASE
            WHEN ((o.production_status)::text = 'completed'::text) THEN 1
            ELSE NULL::integer
        END) AS completed,
    avg((EXTRACT(epoch FROM (o.production_completed_at - o.production_started_at)) / (3600)::numeric)) AS avg_hours
   FROM (public.production_stages ps
     LEFT JOIN public.orders o ON ((ps.id = o.current_stage_id)))
  WHERE (ps.is_active = true)
  GROUP BY ps.id, ps.name, ps.order_index
  ORDER BY ps.order_index;


ALTER TABLE public.production_stats OWNER TO postgres;

--
-- Name: professions_catalog; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.professions_catalog (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    department character varying(100) NOT NULL,
    skill_level character varying(50) NOT NULL,
    hourly_rate numeric(10,2),
    required_education text,
    responsibilities text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.professions_catalog OWNER TO workunital;

--
-- Name: professions_catalog_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.professions_catalog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.professions_catalog_id_seq OWNER TO workunital;

--
-- Name: professions_catalog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.professions_catalog_id_seq OWNED BY public.professions_catalog.id;


--
-- Name: purchase_list_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_list_items (
    id integer NOT NULL,
    purchase_list_id integer,
    material_id integer,
    material_name character varying(255) NOT NULL,
    required_quantity numeric(10,2) NOT NULL,
    available_quantity numeric(10,2) DEFAULT 0,
    missing_quantity numeric(10,2) NOT NULL,
    unit character varying(50) NOT NULL,
    unit_price numeric(10,2) DEFAULT 0,
    total_price numeric(12,2) DEFAULT 0,
    supplier character varying(255),
    notes text,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT purchase_list_items_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'ordered'::character varying, 'received'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.purchase_list_items OWNER TO postgres;

--
-- Name: purchase_list_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_list_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.purchase_list_items_id_seq OWNER TO postgres;

--
-- Name: purchase_list_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_list_items_id_seq OWNED BY public.purchase_list_items.id;


--
-- Name: purchase_lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_lists (
    id integer NOT NULL,
    order_id integer,
    name character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    total_cost numeric(12,2) DEFAULT 0,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    delivery_date date,
    supplier_id integer,
    CONSTRAINT purchase_lists_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.purchase_lists OWNER TO postgres;

--
-- Name: purchase_lists_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_lists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.purchase_lists_id_seq OWNER TO postgres;

--
-- Name: purchase_lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_lists_id_seq OWNED BY public.purchase_lists.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role character varying(50) NOT NULL,
    module character varying(100) NOT NULL,
    permission character varying(100) NOT NULL,
    granted boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role_permissions OWNER TO workunital;

--
-- Name: TABLE role_permissions; Type: COMMENT; Schema: public; Owner: workunital
--

COMMENT ON TABLE public.role_permissions IS 'Разрешения ролей пользователей';


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_permissions_id_seq OWNER TO workunital;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key character varying(255) NOT NULL,
    value text,
    description text,
    category character varying(100) DEFAULT 'general'::character varying,
    data_type character varying(50) DEFAULT 'string'::character varying,
    is_public boolean DEFAULT false,
    is_required boolean DEFAULT false,
    validation_rules jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_settings OWNER TO workunital;

--
-- Name: TABLE system_settings; Type: COMMENT; Schema: public; Owner: workunital
--

COMMENT ON TABLE public.system_settings IS 'Системные настройки приложения';


--
-- Name: settings_overview; Type: VIEW; Schema: public; Owner: workunital
--

CREATE VIEW public.settings_overview AS
 SELECT 'system'::text AS type,
    system_settings.key AS setting_key,
    system_settings.value,
    system_settings.description,
    system_settings.category,
    system_settings.data_type,
    system_settings.is_public,
    system_settings.is_required,
    system_settings.validation_rules,
    system_settings.created_at,
    system_settings.updated_at
   FROM public.system_settings
UNION ALL
 SELECT 'module'::text AS type,
    (((module_settings.module_name)::text || '.'::text) || (module_settings.setting_key)::text) AS setting_key,
    module_settings.value,
    module_settings.description,
    module_settings.module_name AS category,
    module_settings.data_type,
    false AS is_public,
    module_settings.is_required,
    module_settings.validation_rules,
    module_settings.created_at,
    module_settings.updated_at
   FROM public.module_settings;


ALTER TABLE public.settings_overview OWNER TO workunital;

--
-- Name: VIEW settings_overview; Type: COMMENT; Schema: public; Owner: workunital
--

COMMENT ON VIEW public.settings_overview IS 'Обзор всех настроек системы';


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    contact_person character varying(255),
    email character varying(255),
    phone character varying(50),
    address text,
    website character varying(255),
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.suppliers_id_seq OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_settings_id_seq OWNER TO workunital;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: timesheets; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.timesheets (
    id integer NOT NULL,
    employee_id integer,
    work_date date NOT NULL,
    hours_worked numeric(4,2) DEFAULT 0,
    hours_overtime numeric(4,2) DEFAULT 0,
    status character varying(20) DEFAULT 'present'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    CONSTRAINT timesheets_status_check CHECK (((status)::text = ANY ((ARRAY['present'::character varying, 'absent'::character varying, 'sick'::character varying, 'vacation'::character varying, 'day_off'::character varying])::text[])))
);


ALTER TABLE public.timesheets OWNER TO workunital;

--
-- Name: timesheets_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.timesheets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.timesheets_id_seq OWNER TO workunital;

--
-- Name: timesheets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.timesheets_id_seq OWNED BY public.timesheets.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    display_name character varying(100) NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    can_scan boolean DEFAULT false,
    can_confirm boolean DEFAULT false,
    can_generate_qr boolean DEFAULT false,
    can_manage_workers boolean DEFAULT false,
    can_return_orders boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: TABLE user_roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_roles IS 'Роли пользователей в системе производства';


--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_roles_id_seq OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'manager'::character varying,
    avatar character varying(500),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role_id integer,
    stage_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: work_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_log (
    id integer NOT NULL,
    order_id integer NOT NULL,
    operation_id integer NOT NULL,
    employee_id integer NOT NULL,
    quantity integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    work_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    duration_minutes integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.work_log OWNER TO postgres;

--
-- Name: work_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.work_log_id_seq OWNER TO postgres;

--
-- Name: work_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_log_id_seq OWNED BY public.work_log.id;


--
-- Name: work_records; Type: TABLE; Schema: public; Owner: workunital
--

CREATE TABLE public.work_records (
    id integer NOT NULL,
    employee_id integer,
    operation_id integer,
    order_id integer,
    quantity numeric(10,2) NOT NULL,
    piece_rate numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    work_date date NOT NULL,
    shift character varying(20),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


ALTER TABLE public.work_records OWNER TO workunital;

--
-- Name: work_records_id_seq; Type: SEQUENCE; Schema: public; Owner: workunital
--

CREATE SEQUENCE public.work_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.work_records_id_seq OWNER TO workunital;

--
-- Name: work_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workunital
--

ALTER SEQUENCE public.work_records_id_seq OWNED BY public.work_records.id;


--
-- Name: work_time_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_time_logs (
    id integer NOT NULL,
    order_id integer NOT NULL,
    stage_id integer NOT NULL,
    worker_id integer NOT NULL,
    started_at timestamp without time zone NOT NULL,
    finished_at timestamp without time zone,
    work_duration integer,
    hourly_rate numeric(10,2) DEFAULT 0,
    total_payment numeric(10,2) DEFAULT 0,
    is_completed boolean DEFAULT false,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.work_time_logs OWNER TO postgres;

--
-- Name: TABLE work_time_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.work_time_logs IS 'Логи времени работы сотрудников';


--
-- Name: work_time_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_time_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.work_time_logs_id_seq OWNER TO postgres;

--
-- Name: work_time_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_time_logs_id_seq OWNED BY public.work_time_logs.id;


--
-- Name: worker_reports; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.worker_reports AS
SELECT
    NULL::integer AS worker_id,
    NULL::character varying(255) AS worker_name,
    NULL::character varying(100) AS stage_name,
    NULL::bigint AS tasks_count,
    NULL::bigint AS total_minutes,
    NULL::numeric AS total_payment,
    NULL::numeric AS avg_task_duration,
    NULL::bigint AS completed_tasks;


ALTER TABLE public.worker_reports OWNER TO postgres;

--
-- Name: bonuses_penalties id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.bonuses_penalties ALTER COLUMN id SET DEFAULT nextval('public.bonuses_penalties_id_seq'::regclass);


--
-- Name: calculator_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calculator_orders ALTER COLUMN id SET DEFAULT nextval('public.calculator_orders_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: financial_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_transactions ALTER COLUMN id SET DEFAULT nextval('public.financial_transactions_id_seq'::regclass);


--
-- Name: integration_settings id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.integration_settings ALTER COLUMN id SET DEFAULT nextval('public.integration_settings_id_seq'::regclass);


--
-- Name: kanban_columns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kanban_columns ALTER COLUMN id SET DEFAULT nextval('public.kanban_columns_id_seq'::regclass);


--
-- Name: material_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_categories ALTER COLUMN id SET DEFAULT nextval('public.material_categories_id_seq'::regclass);


--
-- Name: material_usage id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_usage ALTER COLUMN id SET DEFAULT nextval('public.material_usage_id_seq'::regclass);


--
-- Name: materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials ALTER COLUMN id SET DEFAULT nextval('public.materials_id_seq'::regclass);


--
-- Name: module_settings id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.module_settings ALTER COLUMN id SET DEFAULT nextval('public.module_settings_id_seq'::regclass);


--
-- Name: notification_settings id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.notification_settings ALTER COLUMN id SET DEFAULT nextval('public.notification_settings_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: operations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operations ALTER COLUMN id SET DEFAULT nextval('public.operations_id_seq'::regclass);


--
-- Name: operations_catalog id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.operations_catalog ALTER COLUMN id SET DEFAULT nextval('public.operations_catalog_id_seq'::regclass);


--
-- Name: order_drawings id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.order_drawings ALTER COLUMN id SET DEFAULT nextval('public.order_drawings_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: order_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_materials ALTER COLUMN id SET DEFAULT nextval('public.order_materials_id_seq'::regclass);


--
-- Name: order_qr_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_qr_codes ALTER COLUMN id SET DEFAULT nextval('public.order_qr_codes_id_seq'::regclass);


--
-- Name: order_returns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_returns ALTER COLUMN id SET DEFAULT nextval('public.order_returns_id_seq'::regclass);


--
-- Name: order_status_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history ALTER COLUMN id SET DEFAULT nextval('public.order_status_history_id_seq'::regclass);


--
-- Name: order_transfers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_transfers ALTER COLUMN id SET DEFAULT nextval('public.order_transfers_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payroll id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll ALTER COLUMN id SET DEFAULT nextval('public.payroll_id_seq'::regclass);


--
-- Name: payroll_calculations id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.payroll_calculations ALTER COLUMN id SET DEFAULT nextval('public.payroll_calculations_id_seq'::regclass);


--
-- Name: payroll_periods id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.payroll_periods ALTER COLUMN id SET DEFAULT nextval('public.payroll_periods_id_seq'::regclass);


--
-- Name: positions id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.positions ALTER COLUMN id SET DEFAULT nextval('public.positions_id_seq'::regclass);


--
-- Name: production_blocks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_blocks ALTER COLUMN id SET DEFAULT nextval('public.production_blocks_id_seq'::regclass);


--
-- Name: production_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_notifications ALTER COLUMN id SET DEFAULT nextval('public.production_notifications_id_seq'::regclass);


--
-- Name: production_operations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_operations ALTER COLUMN id SET DEFAULT nextval('public.production_operations_id_seq'::regclass);


--
-- Name: production_professions id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.production_professions ALTER COLUMN id SET DEFAULT nextval('public.production_professions_id_seq'::regclass);


--
-- Name: production_requirements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_requirements ALTER COLUMN id SET DEFAULT nextval('public.production_requirements_id_seq'::regclass);


--
-- Name: production_stages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_stages ALTER COLUMN id SET DEFAULT nextval('public.production_stages_id_seq'::regclass);


--
-- Name: professions_catalog id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.professions_catalog ALTER COLUMN id SET DEFAULT nextval('public.professions_catalog_id_seq'::regclass);


--
-- Name: purchase_list_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_list_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_list_items_id_seq'::regclass);


--
-- Name: purchase_lists id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_lists ALTER COLUMN id SET DEFAULT nextval('public.purchase_lists_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: timesheets id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.timesheets ALTER COLUMN id SET DEFAULT nextval('public.timesheets_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: work_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_log ALTER COLUMN id SET DEFAULT nextval('public.work_log_id_seq'::regclass);


--
-- Name: work_records id; Type: DEFAULT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.work_records ALTER COLUMN id SET DEFAULT nextval('public.work_records_id_seq'::regclass);


--
-- Name: work_time_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_time_logs ALTER COLUMN id SET DEFAULT nextval('public.work_time_logs_id_seq'::regclass);


--
-- Name: bonuses_penalties bonuses_penalties_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.bonuses_penalties
    ADD CONSTRAINT bonuses_penalties_pkey PRIMARY KEY (id);


--
-- Name: calculator_orders calculator_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calculator_orders
    ADD CONSTRAINT calculator_orders_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: financial_transactions financial_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_pkey PRIMARY KEY (id);


--
-- Name: integration_settings integration_settings_integration_name_key; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.integration_settings
    ADD CONSTRAINT integration_settings_integration_name_key UNIQUE (integration_name);


--
-- Name: integration_settings integration_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.integration_settings
    ADD CONSTRAINT integration_settings_pkey PRIMARY KEY (id);


--
-- Name: kanban_columns kanban_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kanban_columns
    ADD CONSTRAINT kanban_columns_pkey PRIMARY KEY (id);


--
-- Name: material_categories material_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_categories
    ADD CONSTRAINT material_categories_pkey PRIMARY KEY (id);


--
-- Name: material_usage material_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_usage
    ADD CONSTRAINT material_usage_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: module_settings module_settings_module_name_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.module_settings
    ADD CONSTRAINT module_settings_module_name_setting_key_key UNIQUE (module_name, setting_key);


--
-- Name: module_settings module_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.module_settings
    ADD CONSTRAINT module_settings_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_user_id_notification_type_key; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_user_id_notification_type_key UNIQUE (user_id, notification_type);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: operations_catalog operations_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.operations_catalog
    ADD CONSTRAINT operations_catalog_pkey PRIMARY KEY (id);


--
-- Name: operations operations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_pkey PRIMARY KEY (id);


--
-- Name: order_drawings order_drawings_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.order_drawings
    ADD CONSTRAINT order_drawings_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_materials order_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_materials
    ADD CONSTRAINT order_materials_pkey PRIMARY KEY (id);


--
-- Name: order_qr_codes order_qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_qr_codes
    ADD CONSTRAINT order_qr_codes_pkey PRIMARY KEY (id);


--
-- Name: order_qr_codes order_qr_codes_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_qr_codes
    ADD CONSTRAINT order_qr_codes_qr_code_key UNIQUE (qr_code);


--
-- Name: order_returns order_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_returns
    ADD CONSTRAINT order_returns_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: order_transfers order_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_transfers
    ADD CONSTRAINT order_transfers_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payroll_calculations payroll_calculations_employee_id_period_id_key; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.payroll_calculations
    ADD CONSTRAINT payroll_calculations_employee_id_period_id_key UNIQUE (employee_id, period_id);


--
-- Name: payroll_calculations payroll_calculations_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.payroll_calculations
    ADD CONSTRAINT payroll_calculations_pkey PRIMARY KEY (id);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (id);


--
-- Name: payroll payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_pkey PRIMARY KEY (id);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: production_blocks production_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_blocks
    ADD CONSTRAINT production_blocks_pkey PRIMARY KEY (id);


--
-- Name: production_notifications production_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_notifications
    ADD CONSTRAINT production_notifications_pkey PRIMARY KEY (id);


--
-- Name: production_operations production_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_operations
    ADD CONSTRAINT production_operations_pkey PRIMARY KEY (id);


--
-- Name: production_professions production_professions_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.production_professions
    ADD CONSTRAINT production_professions_pkey PRIMARY KEY (id);


--
-- Name: production_requirements production_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_requirements
    ADD CONSTRAINT production_requirements_pkey PRIMARY KEY (id);


--
-- Name: production_requirements production_requirements_stage_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_requirements
    ADD CONSTRAINT production_requirements_stage_key UNIQUE (stage);


--
-- Name: production_stages production_stages_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_stages
    ADD CONSTRAINT production_stages_name_key UNIQUE (name);


--
-- Name: production_stages production_stages_order_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_stages
    ADD CONSTRAINT production_stages_order_index_key UNIQUE (order_index);


--
-- Name: production_stages production_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_stages
    ADD CONSTRAINT production_stages_pkey PRIMARY KEY (id);


--
-- Name: professions_catalog professions_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.professions_catalog
    ADD CONSTRAINT professions_catalog_pkey PRIMARY KEY (id);


--
-- Name: purchase_list_items purchase_list_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_list_items
    ADD CONSTRAINT purchase_list_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_lists purchase_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_lists
    ADD CONSTRAINT purchase_lists_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_module_permission_key; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_module_permission_key UNIQUE (role, module, permission);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: timesheets timesheets_employee_id_work_date_key; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_employee_id_work_date_key UNIQUE (employee_id, work_date);


--
-- Name: timesheets timesheets_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_name_key UNIQUE (name);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: work_log work_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_log
    ADD CONSTRAINT work_log_pkey PRIMARY KEY (id);


--
-- Name: work_records work_records_pkey; Type: CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.work_records
    ADD CONSTRAINT work_records_pkey PRIMARY KEY (id);


--
-- Name: work_time_logs work_time_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_time_logs
    ADD CONSTRAINT work_time_logs_pkey PRIMARY KEY (id);


--
-- Name: idx_calculator_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calculator_orders_created_at ON public.calculator_orders USING btree (created_at);


--
-- Name: idx_calculator_orders_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calculator_orders_order_id ON public.calculator_orders USING btree (order_id);


--
-- Name: idx_customers_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_company ON public.customers USING btree (company);


--
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- Name: idx_customers_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);


--
-- Name: idx_customers_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_status ON public.customers USING btree (status);


--
-- Name: idx_financial_transactions_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_financial_transactions_date ON public.financial_transactions USING btree (transaction_date);


--
-- Name: idx_integration_settings_enabled; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_integration_settings_enabled ON public.integration_settings USING btree (is_enabled);


--
-- Name: idx_material_usage_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_material_usage_order_id ON public.material_usage USING btree (order_id);


--
-- Name: idx_materials_supplier_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materials_supplier_id ON public.materials USING btree (supplier_id);


--
-- Name: idx_module_settings_module; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_module_settings_module ON public.module_settings USING btree (module_name);


--
-- Name: idx_notification_settings_user; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_notification_settings_user ON public.notification_settings USING btree (user_id);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_order_drawings_order_id; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_order_drawings_order_id ON public.order_drawings USING btree (order_id);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_order_materials_material_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_materials_material_name ON public.order_materials USING btree (material_name);


--
-- Name: idx_order_materials_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_materials_order_id ON public.order_materials USING btree (order_id);


--
-- Name: idx_order_qr_codes_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_qr_codes_expires_at ON public.order_qr_codes USING btree (expires_at);


--
-- Name: idx_order_qr_codes_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_qr_codes_order_id ON public.order_qr_codes USING btree (order_id);


--
-- Name: idx_order_qr_codes_qr_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_qr_codes_qr_code ON public.order_qr_codes USING btree (qr_code);


--
-- Name: idx_order_qr_codes_stage_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_qr_codes_stage_id ON public.order_qr_codes USING btree (current_stage_id);


--
-- Name: idx_order_returns_from_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_returns_from_stage ON public.order_returns USING btree (from_stage_id);


--
-- Name: idx_order_returns_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_returns_order_id ON public.order_returns USING btree (order_id);


--
-- Name: idx_order_returns_resolved; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_returns_resolved ON public.order_returns USING btree (is_resolved);


--
-- Name: idx_order_returns_to_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_returns_to_stage ON public.order_returns USING btree (to_stage_id);


--
-- Name: idx_order_returns_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_returns_type ON public.order_returns USING btree (return_type);


--
-- Name: idx_order_transfers_from_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_transfers_from_stage ON public.order_transfers USING btree (from_stage_id);


--
-- Name: idx_order_transfers_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_transfers_order_id ON public.order_transfers USING btree (order_id);


--
-- Name: idx_order_transfers_scanned_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_transfers_scanned_by ON public.order_transfers USING btree (scanned_by);


--
-- Name: idx_order_transfers_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_transfers_status ON public.order_transfers USING btree (status);


--
-- Name: idx_order_transfers_to_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_transfers_to_stage ON public.order_transfers USING btree (to_stage_id);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);


--
-- Name: idx_orders_current_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_current_stage ON public.orders USING btree (current_stage_id);


--
-- Name: idx_orders_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_customer_id ON public.orders USING btree (customer_id);


--
-- Name: idx_orders_production_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_production_status ON public.orders USING btree (production_status);


--
-- Name: idx_orders_qr_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_qr_code ON public.orders USING btree (qr_code_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_payroll_calculations_employee_id; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_payroll_calculations_employee_id ON public.payroll_calculations USING btree (employee_id);


--
-- Name: idx_payroll_calculations_period_id; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_payroll_calculations_period_id ON public.payroll_calculations USING btree (period_id);


--
-- Name: idx_payroll_employee_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_employee_month ON public.payroll USING btree (employee_id, month);


--
-- Name: idx_production_blocks_material_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_production_blocks_material_type ON public.production_blocks USING btree (material_type);


--
-- Name: idx_production_blocks_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_production_blocks_order_id ON public.production_blocks USING btree (order_id);


--
-- Name: idx_production_blocks_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_production_blocks_stage ON public.production_blocks USING btree (stage);


--
-- Name: idx_production_blocks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_production_blocks_status ON public.production_blocks USING btree (status);


--
-- Name: idx_production_notifications_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_production_notifications_order_id ON public.production_notifications USING btree (order_id);


--
-- Name: idx_production_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_production_notifications_read ON public.production_notifications USING btree (is_read);


--
-- Name: idx_production_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_production_notifications_type ON public.production_notifications USING btree (type);


--
-- Name: idx_production_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_production_notifications_user_id ON public.production_notifications USING btree (user_id);


--
-- Name: idx_purchase_list_items_material_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_list_items_material_id ON public.purchase_list_items USING btree (material_id);


--
-- Name: idx_purchase_list_items_purchase_list_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_list_items_purchase_list_id ON public.purchase_list_items USING btree (purchase_list_id);


--
-- Name: idx_purchase_list_items_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_list_items_status ON public.purchase_list_items USING btree (status);


--
-- Name: idx_purchase_lists_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_lists_order_id ON public.purchase_lists USING btree (order_id);


--
-- Name: idx_purchase_lists_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_purchase_lists_status ON public.purchase_lists USING btree (status);


--
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role);


--
-- Name: idx_suppliers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_email ON public.suppliers USING btree (email);


--
-- Name: idx_suppliers_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_is_active ON public.suppliers USING btree (is_active);


--
-- Name: idx_suppliers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_name ON public.suppliers USING btree (name);


--
-- Name: idx_suppliers_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_phone ON public.suppliers USING btree (phone);


--
-- Name: idx_system_settings_category; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_system_settings_category ON public.system_settings USING btree (category);


--
-- Name: idx_system_settings_public; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_system_settings_public ON public.system_settings USING btree (is_public);


--
-- Name: idx_timesheets_employee_id; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_timesheets_employee_id ON public.timesheets USING btree (employee_id);


--
-- Name: idx_timesheets_work_date; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_timesheets_work_date ON public.timesheets USING btree (work_date);


--
-- Name: idx_work_log_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_log_employee_id ON public.work_log USING btree (employee_id);


--
-- Name: idx_work_log_operation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_log_operation_id ON public.work_log USING btree (operation_id);


--
-- Name: idx_work_log_work_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_log_work_date ON public.work_log USING btree (work_date);


--
-- Name: idx_work_records_employee_id; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_work_records_employee_id ON public.work_records USING btree (employee_id);


--
-- Name: idx_work_records_order_id; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_work_records_order_id ON public.work_records USING btree (order_id);


--
-- Name: idx_work_records_work_date; Type: INDEX; Schema: public; Owner: workunital
--

CREATE INDEX idx_work_records_work_date ON public.work_records USING btree (work_date);


--
-- Name: idx_work_time_logs_completed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_time_logs_completed ON public.work_time_logs USING btree (is_completed);


--
-- Name: idx_work_time_logs_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_time_logs_order_id ON public.work_time_logs USING btree (order_id);


--
-- Name: idx_work_time_logs_stage_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_time_logs_stage_id ON public.work_time_logs USING btree (stage_id);


--
-- Name: idx_work_time_logs_started_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_time_logs_started_at ON public.work_time_logs USING btree (started_at);


--
-- Name: idx_work_time_logs_worker_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_time_logs_worker_id ON public.work_time_logs USING btree (worker_id);


--
-- Name: worker_reports _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.worker_reports AS
 SELECT u.id AS worker_id,
    u.name AS worker_name,
    ps.name AS stage_name,
    count(wtl.id) AS tasks_count,
    sum(wtl.work_duration) AS total_minutes,
    sum(wtl.total_payment) AS total_payment,
    avg(wtl.work_duration) AS avg_task_duration,
    count(
        CASE
            WHEN (wtl.is_completed = true) THEN 1
            ELSE NULL::integer
        END) AS completed_tasks
   FROM ((public.users u
     JOIN public.work_time_logs wtl ON ((u.id = wtl.worker_id)))
     JOIN public.production_stages ps ON ((wtl.stage_id = ps.id)))
  WHERE (u.is_active = true)
  GROUP BY u.id, u.name, ps.id, ps.name
  ORDER BY u.name, ps.order_index;


--
-- Name: work_time_logs calculate_work_duration_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER calculate_work_duration_trigger BEFORE INSERT OR UPDATE ON public.work_time_logs FOR EACH ROW EXECUTE FUNCTION public.calculate_work_duration();


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_customers_updated_at();


--
-- Name: departments update_departments_updated_at; Type: TRIGGER; Schema: public; Owner: workunital
--

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: integration_settings update_integration_settings_updated_at; Type: TRIGGER; Schema: public; Owner: workunital
--

CREATE TRIGGER update_integration_settings_updated_at BEFORE UPDATE ON public.integration_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: module_settings update_module_settings_updated_at; Type: TRIGGER; Schema: public; Owner: workunital
--

CREATE TRIGGER update_module_settings_updated_at BEFORE UPDATE ON public.module_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_settings update_notification_settings_updated_at; Type: TRIGGER; Schema: public; Owner: workunital
--

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: order_qr_codes update_order_qr_codes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_order_qr_codes_updated_at BEFORE UPDATE ON public.order_qr_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: positions update_positions_updated_at; Type: TRIGGER; Schema: public; Owner: workunital
--

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: production_blocks update_production_blocks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_production_blocks_updated_at BEFORE UPDATE ON public.production_blocks FOR EACH ROW EXECUTE FUNCTION public.update_production_blocks_updated_at();


--
-- Name: production_stages update_production_stages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_production_stages_updated_at BEFORE UPDATE ON public.production_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: suppliers update_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_suppliers_updated_at();


--
-- Name: system_settings update_system_settings_updated_at; Type: TRIGGER; Schema: public; Owner: workunital
--

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: customers customers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: financial_transactions financial_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: material_usage material_usage_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_usage
    ADD CONSTRAINT material_usage_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: material_usage material_usage_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_usage
    ADD CONSTRAINT material_usage_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES public.production_operations(id);


--
-- Name: materials materials_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.material_categories(id);


--
-- Name: materials materials_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: notification_settings notification_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: order_drawings order_drawings_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.order_drawings
    ADD CONSTRAINT order_drawings_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: order_materials order_materials_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_materials
    ADD CONSTRAINT order_materials_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_qr_codes order_qr_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_qr_codes
    ADD CONSTRAINT order_qr_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: order_qr_codes order_qr_codes_current_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_qr_codes
    ADD CONSTRAINT order_qr_codes_current_stage_id_fkey FOREIGN KEY (current_stage_id) REFERENCES public.production_stages(id);


--
-- Name: order_qr_codes order_qr_codes_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_qr_codes
    ADD CONSTRAINT order_qr_codes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_returns order_returns_from_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_returns
    ADD CONSTRAINT order_returns_from_stage_id_fkey FOREIGN KEY (from_stage_id) REFERENCES public.production_stages(id);


--
-- Name: order_returns order_returns_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_returns
    ADD CONSTRAINT order_returns_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_returns order_returns_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_returns
    ADD CONSTRAINT order_returns_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: order_returns order_returns_returned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_returns
    ADD CONSTRAINT order_returns_returned_by_fkey FOREIGN KEY (returned_by) REFERENCES public.users(id);


--
-- Name: order_returns order_returns_to_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_returns
    ADD CONSTRAINT order_returns_to_stage_id_fkey FOREIGN KEY (to_stage_id) REFERENCES public.production_stages(id);


--
-- Name: order_status_history order_status_history_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: order_transfers order_transfers_from_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_transfers
    ADD CONSTRAINT order_transfers_from_stage_id_fkey FOREIGN KEY (from_stage_id) REFERENCES public.production_stages(id);


--
-- Name: order_transfers order_transfers_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_transfers
    ADD CONSTRAINT order_transfers_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_transfers order_transfers_scanned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_transfers
    ADD CONSTRAINT order_transfers_scanned_by_fkey FOREIGN KEY (scanned_by) REFERENCES public.users(id);


--
-- Name: order_transfers order_transfers_to_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_transfers
    ADD CONSTRAINT order_transfers_to_stage_id_fkey FOREIGN KEY (to_stage_id) REFERENCES public.production_stages(id);


--
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: orders orders_current_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_current_stage_id_fkey FOREIGN KEY (current_stage_id) REFERENCES public.production_stages(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: orders orders_qr_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_qr_code_id_fkey FOREIGN KEY (qr_code_id) REFERENCES public.order_qr_codes(id);


--
-- Name: payroll_calculations payroll_calculations_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.payroll_calculations
    ADD CONSTRAINT payroll_calculations_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id) ON DELETE CASCADE;


--
-- Name: payroll payroll_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: positions positions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: production_blocks production_blocks_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_blocks
    ADD CONSTRAINT production_blocks_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: production_notifications production_notifications_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_notifications
    ADD CONSTRAINT production_notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: production_notifications production_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_notifications
    ADD CONSTRAINT production_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: production_operations production_operations_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_operations
    ADD CONSTRAINT production_operations_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: production_operations production_operations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_operations
    ADD CONSTRAINT production_operations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: purchase_list_items purchase_list_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_list_items
    ADD CONSTRAINT purchase_list_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;


--
-- Name: purchase_list_items purchase_list_items_purchase_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_list_items
    ADD CONSTRAINT purchase_list_items_purchase_list_id_fkey FOREIGN KEY (purchase_list_id) REFERENCES public.purchase_lists(id) ON DELETE CASCADE;


--
-- Name: purchase_lists purchase_lists_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_lists
    ADD CONSTRAINT purchase_lists_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: purchase_lists purchase_lists_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_lists
    ADD CONSTRAINT purchase_lists_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: purchase_lists purchase_lists_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_lists
    ADD CONSTRAINT purchase_lists_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.user_roles(id);


--
-- Name: users users_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.production_stages(id);


--
-- Name: work_log work_log_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_log
    ADD CONSTRAINT work_log_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: work_log work_log_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_log
    ADD CONSTRAINT work_log_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES public.operations(id);


--
-- Name: work_records work_records_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workunital
--

ALTER TABLE ONLY public.work_records
    ADD CONSTRAINT work_records_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: work_time_logs work_time_logs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_time_logs
    ADD CONSTRAINT work_time_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: work_time_logs work_time_logs_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_time_logs
    ADD CONSTRAINT work_time_logs_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.production_stages(id);


--
-- Name: work_time_logs work_time_logs_worker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_time_logs
    ADD CONSTRAINT work_time_logs_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict VoBoX1kbpXViNdKtV2YE83YphBybsb5Z0Ps3oZrd8jf5q4qbtdx5eJ5xIAjlFKe

