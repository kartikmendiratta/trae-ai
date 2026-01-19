
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: Supabase credentials not found in .env")
    exit(1)

supabase = create_client(url, key)

ADMIN_ID = "00000000-0000-0000-0000-000000000002"

data = {
    "id": ADMIN_ID,
    "email": "admin@trae.ai",
    "full_name": "Support Admin",
    "role": "admin"
}

try:
    # 1. We might strictly need a user in auth.users first due to FK, 
    # but profiles.id references auth.users(id). 
    # If the constraint exists, we must insert into auth.users first.
    # Looking at schema: id uuid references auth.users on delete cascade
    # Yes, we need auth.users.
    
    # However, we can't easily insert into auth.users via supabase-py client (it's protected).
    # But wait, we are using SERVICE_KEY.
    
    # Actually, simpler MVP hack: The schema says `references public.profiles(id)` for messages.
    # But `profiles.id` references `auth.users`.
    
    # If I cannot insert into auth.users via API, I am stuck unless I use SQL.
    # BUT, I can use `supabase.auth.admin.create_user` if I have service role!
    
    print("Creating admin user in auth...")
    try:
        user = supabase.auth.admin.create_user({
            "email": "admin@trae.ai",
            "password": "securepassword123",
            "email_confirm": True,
            "user_metadata": {"full_name": "Support Admin"}
        })
        print(f"User created with ID: {user.user.id}")
        # The trigger will auto-create the profile!
        # So I just need to grab that ID.
        print(f"Admin ID to use: {user.user.id}")
        
        # Save this ID to a file so I can read it
        with open("admin_id.txt", "w") as f:
            f.write(user.user.id)
            
    except Exception as e:
        print(f"User creation might have failed (already exists?): {e}")
        # Try to find the user
        # This part is tricky without direct SQL.
        pass

except Exception as e:
    print(f"Error: {e}")
