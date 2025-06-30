--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: boetos-db_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO "boetos-db_owner";

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: boetos-db_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_intervention_rule; Type: TABLE; Schema: public; Owner: boetos-db_owner
--

CREATE TABLE public.ai_intervention_rule (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    rule_type character varying NOT NULL,
    rule_condition jsonb,
    intervention_method character varying,
    intervention_message_template text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_intervention_rule OWNER TO "boetos-db_owner";

--
-- Name: ai_intervention_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: boetos-db_owner
--

CREATE SEQUENCE public.ai_intervention_rule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_intervention_rule_id_seq OWNER TO "boetos-db_owner";

--
-- Name: ai_intervention_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: boetos-db_owner
--

ALTER SEQUENCE public.ai_intervention_rule_id_seq OWNED BY public.ai_intervention_rule.id;


--
-- Name: burnout_scores; Type: TABLE; Schema: public; Owner: boetos-db_owner
--

CREATE TABLE public.burnout_scores (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    score double precision NOT NULL,
    date timestamp without time zone NOT NULL,
    meeting_hours double precision,
    work_hours double precision,
    focus_blocks double precision,
    breaks_taken double precision,
    sleep_hours double precision,
    stress_indicators jsonb,
    recovery_indicators jsonb,
    metrics jsonb,
    ai_insights text,
    recommendations jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.burnout_scores OWNER TO "boetos-db_owner";

--
-- Name: burnout_thresholds; Type: TABLE; Schema: public; Owner: boetos-db_owner
--

CREATE TABLE public.burnout_thresholds (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    max_meeting_hours_per_day double precision DEFAULT 4.0,
    max_work_hours_per_day double precision DEFAULT 8.0,
    min_break_hours_per_day double precision DEFAULT 1.0,
    min_focus_blocks_per_day double precision DEFAULT 2.0,
    min_sleep_hours double precision DEFAULT 7.0,
    meeting_weight double precision DEFAULT 0.3,
    work_hours_weight double precision DEFAULT 0.2,
    break_weight double precision DEFAULT 0.15,
    focus_weight double precision DEFAULT 0.2,
    sleep_weight double precision DEFAULT 0.15,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.burnout_thresholds OWNER TO "boetos-db_owner";

--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: boetos-db_owner
--

CREATE TABLE public.calendar_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    external_id character varying,
    title character varying NOT NULL,
    description text,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    is_all_day boolean DEFAULT false,
    event_type character varying,
    attendees_count integer,
    calendar_source character varying,
    stress_impact double precision,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.calendar_events OWNER TO "boetos-db_owner";

--
-- Name: memory_entries; Type: TABLE; Schema: public; Owner: boetos-db_owner
--

CREATE TABLE public.memory_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    type character varying DEFAULT 'note'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "nudgePreference" character varying DEFAULT 'daily'::character varying NOT NULL,
    "snoozedUntil" timestamp without time zone,
    "isArchived" boolean DEFAULT false NOT NULL,
    "isDone" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.memory_entries OWNER TO "boetos-db_owner";

--
-- Name: mental_health_checks; Type: TABLE; Schema: public; Owner: boetos-db_owner
--

CREATE TABLE public.mental_health_checks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    mood integer NOT NULL,
    stress integer NOT NULL,
    sleep integer NOT NULL,
    energy integer NOT NULL,
    notes text,
    risk_score double precision NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mental_health_checks OWNER TO "boetos-db_owner";

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: boetos-db_owner
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO "boetos-db_owner";

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: boetos-db_owner
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO "boetos-db_owner";

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: boetos-db_owner
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: boetos-db_owner
--

CREATE TABLE public.user_preferences (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    preferred_channel character varying NOT NULL,
    quiet_hours_start character varying,
    quiet_hours_end character varying,
    reminder_frequency integer,
    tone_preference character varying NOT NULL,
    auto_track_categories text[] NOT NULL,
    enable_ai_interventions boolean NOT NULL,
    preferred_intervention_method character varying,
    ai_tone_preference jsonb,
    custom_intervention_messages jsonb,
    ai_onboarding_memory jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_preferences OWNER TO "boetos-db_owner";

--
-- Name: user_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: boetos-db_owner
--

CREATE SEQUENCE public.user_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_preferences_id_seq OWNER TO "boetos-db_owner";

--
-- Name: user_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: boetos-db_owner
--

ALTER SEQUENCE public.user_preferences_id_seq OWNED BY public.user_preferences.id;


--
-- Name: user_voice_settings; Type: TABLE; Schema: public; Owner: boetos-db_owner
--

CREATE TABLE public.user_voice_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    voice_model character varying,
    voice_id character varying,
    voice_enabled boolean DEFAULT false,
    voice_language character varying,
    voice_speed double precision DEFAULT 1.0,
    voice_pitch double precision DEFAULT 1.0,
    voice_volume double precision DEFAULT 1.0,
    voice_gender character varying,
    voice_accent character varying,
    voice_style character varying,
    voice_emotion character varying,
    voice_background character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_voice_settings OWNER TO "boetos-db_owner";

--
-- Name: users; Type: TABLE; Schema: public; Owner: boetos-db_owner
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    password character varying,
    name character varying NOT NULL,
    profile_image character varying,
    avatar character varying,
    preferences jsonb,
    onboarding_completed boolean DEFAULT false NOT NULL,
    onboarding_data jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    google_id character varying,
    google_access_token character varying,
    google_refresh_token character varying,
    voice_settings_id uuid,
    email_verified boolean DEFAULT false NOT NULL,
    email_verification_token character varying,
    email_verification_expires timestamp without time zone
);


ALTER TABLE public.users OWNER TO "boetos-db_owner";

--
-- Name: ai_intervention_rule id; Type: DEFAULT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.ai_intervention_rule ALTER COLUMN id SET DEFAULT nextval('public.ai_intervention_rule_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: user_preferences id; Type: DEFAULT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.user_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_preferences_id_seq'::regclass);


--
-- Name: memory_entries PK_memory_entries; Type: CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.memory_entries
    ADD CONSTRAINT "PK_memory_entries" PRIMARY KEY (id);


--
-- Name: mental_health_checks PK_mental_health_checks; Type: CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.mental_health_checks
    ADD CONSTRAINT "PK_mental_health_checks" PRIMARY KEY (id);


--
-- Name: migrations PK_migrations; Type: CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_migrations" PRIMARY KEY (id);


--
-- Name: user_preferences PK_user_preferences; Type: CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT "PK_user_preferences" PRIMARY KEY (id);


--
-- Name: users PK_users; Type: CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_users" PRIMARY KEY (id);


--
-- Name: users UQ_users_email; Type: CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_users_email" UNIQUE (email);


--
-- Name: ai_intervention_rule ai_intervention_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.ai_intervention_rule
    ADD CONSTRAINT ai_intervention_rule_pkey PRIMARY KEY (id);


--
-- Name: burnout_scores burnout_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.burnout_scores
    ADD CONSTRAINT burnout_scores_pkey PRIMARY KEY (id);


--
-- Name: burnout_thresholds burnout_thresholds_pkey; Type: CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.burnout_thresholds
    ADD CONSTRAINT burnout_thresholds_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: user_voice_settings user_voice_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.user_voice_settings
    ADD CONSTRAINT user_voice_settings_pkey PRIMARY KEY (id);


--
-- Name: IDX_BURNOUT_SCORE_USER_DATE; Type: INDEX; Schema: public; Owner: boetos-db_owner
--

CREATE INDEX "IDX_BURNOUT_SCORE_USER_DATE" ON public.burnout_scores USING btree (user_id, date);


--
-- Name: IDX_burnout_thresholds_user_id; Type: INDEX; Schema: public; Owner: boetos-db_owner
--

CREATE UNIQUE INDEX "IDX_burnout_thresholds_user_id" ON public.burnout_thresholds USING btree (user_id);


--
-- Name: IDX_calendar_events_external_id; Type: INDEX; Schema: public; Owner: boetos-db_owner
--

CREATE INDEX "IDX_calendar_events_external_id" ON public.calendar_events USING btree (external_id);


--
-- Name: IDX_calendar_events_start_time; Type: INDEX; Schema: public; Owner: boetos-db_owner
--

CREATE INDEX "IDX_calendar_events_start_time" ON public.calendar_events USING btree (start_time);


--
-- Name: IDX_calendar_events_user_id; Type: INDEX; Schema: public; Owner: boetos-db_owner
--

CREATE INDEX "IDX_calendar_events_user_id" ON public.calendar_events USING btree (user_id);


--
-- Name: IDX_mental_health_user_date; Type: INDEX; Schema: public; Owner: boetos-db_owner
--

CREATE INDEX "IDX_mental_health_user_date" ON public.mental_health_checks USING btree (user_id, created_at);


--
-- Name: burnout_thresholds FK_burnout_thresholds_user; Type: FK CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.burnout_thresholds
    ADD CONSTRAINT "FK_burnout_thresholds_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: calendar_events FK_calendar_events_user; Type: FK CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT "FK_calendar_events_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: memory_entries FK_memory_entries_user; Type: FK CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.memory_entries
    ADD CONSTRAINT "FK_memory_entries_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mental_health_checks FK_mental_health_checks_user; Type: FK CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.mental_health_checks
    ADD CONSTRAINT "FK_mental_health_checks_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_preferences FK_user_preferences_user; Type: FK CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT "FK_user_preferences_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_voice_settings FK_user_voice_settings_user; Type: FK CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.user_voice_settings
    ADD CONSTRAINT "FK_user_voice_settings_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users FK_users_voice_settings; Type: FK CONSTRAINT; Schema: public; Owner: boetos-db_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_users_voice_settings" FOREIGN KEY (voice_settings_id) REFERENCES public.user_voice_settings(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: boetos-db_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

