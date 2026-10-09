from app.storage import build_key, upload_file

FOLDER_NAME = "learning-contents"
BASE_PATH = "C:/Users/Gab/OneDrive/Documents/alsense_data_dump/premodel_contents"

contents = [
    {
        "filename": "EN_high",
        "ext": "mp4",
    },
    {
        "filename": "EN_low",
        "ext": "mp4",
    },
    {
        "filename": "EN_med",
        "ext": "mp4",
    },
    {
        "filename": "FIL_high",
        "ext": "mp4",
    },
    {
        "filename": "FIL_low",
        "ext": "mp4",
    },
    {
        "filename": "FIL_med",
        "ext": "mp4",
    },
    {
        "filename": "MAT_high",
        "ext": "mp4",
    },
    {
        "filename": "MAT_low",
        "ext": "mp4",
    },
    {
        "filename": "MAT_med",
        "ext": "mp4",
    },
]


def seed_bucket_posttest_contents():
    for content in contents:

        filename = content.get("filename")
        ext = content.get("ext")

        key = build_key(
            FOLDER_NAME,
            f"{filename}.{ext}",
        )

        upload_file(
            f"{BASE_PATH}/{filename}.{ext}",
            key,
            "video/mp4",
        )

        print(f"{filename} - {key}")


if __name__ == "__main__":
    seed_bucket_posttest_contents()
