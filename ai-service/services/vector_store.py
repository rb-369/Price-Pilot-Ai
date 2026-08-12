import os
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "chroma_db")

def get_vectorstore(collection_name="ecommerce_data"):
    # Use LLM_API_KEY as the primary key since it's the standard Gemini key (AIzaSy...)
    api_key = os.getenv("LLM_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("CHATBOT_API_KEY")
    if not api_key:
        print("Warning: No Gemini API key found. Vectorstore will fail.")
        return None

    # Try multiple embedding models in order of preference
    embedding_models = [
        "models/text-embedding-004",
        "models/embedding-001",
    ]

    for model_name in embedding_models:
        try:
            embeddings = GoogleGenerativeAIEmbeddings(
                model=model_name,
                google_api_key=api_key
            )
            # Quick test to verify the model works
            embeddings.embed_query("test")
            return Chroma(
                collection_name=collection_name,
                embedding_function=embeddings,
                persist_directory=CHROMA_PATH
            )
        except Exception as e:
            print(f"Embedding model {model_name} failed: {e}")
            continue

    print("All embedding models failed. Vectorstore unavailable.")
    return None

def ingest_data(data_list, data_type="product", collection_name="ecommerce_data"):
    """
    Ingests raw dictionaries into the vector store.
    data_list: list of dictionaries representing products, competitors, or alerts.
    """
    if not data_list:
        return 0
        
    try:
        store = get_vectorstore(collection_name)
        if not store:
            return 0

        docs = []
        ids = []
        
        for item in data_list:
            content_parts = []
            for k, v in item.items():
                if k not in ['_id', 'id'] and v is not None:
                    content_parts.append(f"{k}: {v}")
                    
            content = " | ".join(content_parts)
            doc_id = str(item.get("sku", item.get("id", item.get("_id", hash(content)))))
            
            doc = Document(
                page_content=content,
                metadata={"type": data_type, "id": doc_id}
            )
            docs.append(doc)
            ids.append(f"{data_type}_{doc_id}")
            
        if docs:
            store.add_documents(documents=docs, ids=ids)
            
        return len(docs)
    except Exception as e:
        print(f"Vectorstore ingest warning (non-fatal): {e}")
        return 0

def get_retriever(k=3, collection_name="ecommerce_data"):
    try:
        store = get_vectorstore(collection_name)
        if store:
            return store.as_retriever(search_kwargs={"k": k})
    except Exception as e:
        print(f"Vectorstore retriever warning: {e}")
    return None
