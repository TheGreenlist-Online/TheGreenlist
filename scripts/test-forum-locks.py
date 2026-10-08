"""Two-session regression for a disposable fixture database, using psql.
Connection uses standard PG* variables. Never point this at a real project.
"""
import subprocess
import time

ACTOR = '11111111-1111-4111-8111-111111111111'
MODERATOR = '66666666-6666-4666-8666-666666666666'
THREAD = '33333333-3333-4333-8333-333333333333'

def sql(command):
    return subprocess.run(['psql', '-X', '-v', 'ON_ERROR_STOP=1', '-Atq'], input=command, text=True, capture_output=True, timeout=15)

def checked(command):
    result = sql(command)
    if result.returncode:
        raise RuntimeError(result.stderr)
    return result.stdout.strip()

def session(actor):
    return f"set local role authenticated; select set_config('request.jwt.claims','{{\"sub\":\"{actor}\",\"role\":\"authenticated\"}}',true);"

# Tests commit synthetic fixtures only inside the disposable CI database.
checked(f"""
insert into auth.users(id,email,raw_user_meta_data) values
('{ACTOR}','lock-user@example.invalid','{{}}'),
('22222222-2222-4222-8222-222222222222','lock-author@example.invalid','{{}}'),
('{MODERATOR}','lock-moderator@example.invalid','{{}}');
alter table public.profiles disable trigger protect_profile_authority;
update public.profiles set role='MODERATOR' where id='{MODERATOR}';
alter table public.profiles enable trigger protect_profile_authority;
insert into public.forum_threads(id,forum_id,author_id,title,body)
values('{THREAD}',(select id from public.forums limit 1),'22222222-2222-4222-8222-222222222222','Lock fixture','Fixture');
""")

def overlap(first, second, expected):
    # Keep the first transaction open on stdin after its READY marker. No sleep
    # in SQL, and the second session must actually be waiting on a database lock.
    first_session = subprocess.Popen(['psql','-X','-v','ON_ERROR_STOP=1','-Atq'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    second_session = None
    try:
        first_session.stdin.write(f"begin; {first}; select 'READY';\n")
        first_session.stdin.flush()
        while first_session.stdout.readline().strip() != 'READY':
            if first_session.poll() is not None:
                raise RuntimeError(first_session.stderr.read())
        second_session = subprocess.Popen(['psql','-X','-v','ON_ERROR_STOP=1','-Atq'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        second_session.stdin.write(f"begin; {second}; commit;\n")
        second_session.stdin.close()
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            waiting = checked("select count(*) from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid() and wait_event_type='Lock';")
            if int(waiting) > 0:
                break
            if second_session.poll() is not None:
                raise AssertionError('Second session did not wait for the parent lock')
            time.sleep(0.05)
        else:
            raise AssertionError('No parent lock wait observed')
        first_session.stdin.write('commit;\n')
        first_session.stdin.close()
        first_session.wait(timeout=10)
        if first_session.returncode:
            raise RuntimeError(first_session.stderr.read())
        second_session.wait(timeout=10)
        stderr = second_session.stderr.read()
        if expected == 'deny':
            assert second_session.returncode != 0 and 'accessible published and unlocked thread' in stderr, stderr
        else:
            assert second_session.returncode == 0, stderr
    finally:
        for process in (first_session, second_session):
            if process and process.poll() is None:
                process.kill()
                process.wait()

lock = f"{session(MODERATOR)} select public.moderate_forum_content('thread','{THREAD}','{{\"is_locked\":true}}','Concurrency lock')"
reply = f"{session(ACTOR)} insert into public.forum_posts(thread_id,author_id,body) values('{THREAD}','{ACTOR}','Concurrent reply')"
overlap(lock, reply, 'deny')
assert checked("select count(*) from public.forum_posts") == '0'
checked(f"begin; {session(MODERATOR)} select public.moderate_forum_content('thread','{THREAD}','{{\"is_locked\":false}}','Concurrency reopen'); commit;")
overlap(reply, lock, 'allow')
assert checked("select count(*) from public.forum_posts") == '1'
assert checked(f"select is_locked from public.forum_threads where id='{THREAD}'") == 't'
print('PASS: lock-first rejects reply; reply-first serializes before lock')
